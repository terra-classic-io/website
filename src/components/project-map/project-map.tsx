import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { select } from "d3-selection";
import { zoom as d3Zoom, ZoomBehavior, ZoomTransform, zoomIdentity } from "d3-zoom";
import { useSearchParams } from "react-router-dom";
import { categories as sourceCategories, ProjectIndicator } from "../../data/projects";
import { useTheme } from "../../contexts/ThemeContext";
import {
  INDICATOR_VISUALS,
  MIN_TAP_TARGET,
  ZOOM_MAX,
  ZOOM_MIN,
  IndicatorVisual,
} from "./constants";
import {
  createDefaultProjectMapLayout,
  createProjectMapLayout,
  DEFAULT_LAYOUT_HEIGHT,
  DEFAULT_LAYOUT_WIDTH,
} from "./layout";
import type { ProjectMapCategory, ProjectMapEdge, ProjectMapLayout, ProjectMapNode } from "./types";
import { renderProjectMap, RenderTransform } from "./renderer";
import { ProjectMapSimulation } from "./simulator";
import { clampNodeToCategory, clampNodeToViewport, pointInPolygon } from "./geometry";
import styles from "./project-map.module.css";
import { RefreshCcw } from "lucide-react";

interface TooltipState {
  readonly nodeId: string;
  readonly anchorX: number;
  readonly anchorY: number;
}

interface QueryState {
  readonly categories: readonly string[];
  readonly search: string;
  readonly zoom: number | null;
  readonly focus: string | null;
}

interface AnalyticsPayload {
  readonly event: string;
  readonly payload: Record<string, string>;
}

const TOOLTIP_OFFSET: number = 18;
const DRAG_MOVE_THRESHOLD: number = 6;
const SEARCH_DEBOUNCE_MS: number = 200;
const KEYBOARD_NUDGE: number = 8;
const DOUBLE_TAP_TIMEOUT_MS: number = 240;

const trackEvent = (event: AnalyticsPayload): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent("project-map-analytics", { detail: event }));
};

const parseQueryState = (searchParams: URLSearchParams): QueryState => {
  const rawCategories: string | null = searchParams.get("cat");
  const categories = rawCategories ? rawCategories.split(",").map((value) => value.trim()).filter(Boolean) : [];
  const search: string = searchParams.get("q") ?? "";
  const zoomValue = searchParams.get("zoom");
  const zoom = zoomValue ? Number.parseFloat(zoomValue) : null;
  const focus = searchParams.get("focus");
  return {
    categories,
    search,
    zoom: Number.isFinite(zoom ?? NaN) ? zoom : null,
    focus: focus ?? null,
  };
};

const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return url;
  }
};

const findCategoryByTitle = (
  categories: readonly ProjectMapCategory[],
  title: string,
): ProjectMapCategory | undefined => categories.find((category) => category.title === title);

const computeSearchMatches = (
  nodes: readonly ProjectMapNode[],
  query: string,
): ReadonlySet<string> => {
  if (query.trim().length === 0) {
    return new Set(nodes.map((node) => node.id));
  }
  const lower = query.toLowerCase();
  const matches = nodes
    .filter((node) => node.searchTerms.includes(lower))
    .map((node) => node.id);
  return new Set(matches);
};

const clampZoom = (value: number): number => {
  if (value < ZOOM_MIN) {
    return ZOOM_MIN;
  }
  if (value > ZOOM_MAX) {
    return ZOOM_MAX;
  }
  return value;
};

const toTransform = (zoomTransform: ZoomTransform): RenderTransform => ({
  zoom: clampZoom(zoomTransform.k),
  translateX: zoomTransform.x,
  translateY: zoomTransform.y,
});

const computeNodeScreenPosition = (
  node: ProjectMapNode,
  transform: RenderTransform,
): { readonly x: number; readonly y: number } => ({
  x: node.x * transform.zoom + transform.translateX,
  y: node.y * transform.zoom + transform.translateY,
});

const getThemeMode = (resolved: string): "light" | "dark" => (resolved === "dark" ? "dark" : "light");

type DragState = {
  nodeId: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
};

const ProjectMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const doubleTapRef = useRef<number | null>(null);
  const parsedQueryRef = useRef<boolean>(false);
  const searchDebounceRef = useRef<number | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { resolvedTheme } = useTheme();

  const [layout, setLayout] = useState<ProjectMapLayout>(() => createDefaultProjectMapLayout());
  const [transform, setTransform] = useState<RenderTransform>({
    zoom: 1,
    translateX: 0,
    translateY: 0,
  });
  const [activeCategoryIds, setActiveCategoryIds] = useState<readonly string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMatches, setSearchMatches] = useState<ReadonlySet<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);

  const simulationRef = useRef<ProjectMapSimulation | null>(null);
  const nodesRef = useRef<ProjectMapNode[]>(layout.nodes.map((node) => ({ ...node })));
  const categoriesRef = useRef<ProjectMapCategory[]>(layout.categories.map((category) => ({ ...category })));
  const edgesRef = useRef<ProjectMapEdge[]>(layout.edges.map((edge) => ({ ...edge })));
  const transformRef = useRef<RenderTransform>(transform);
  const activeCategoryIdsRef = useRef<readonly string[]>(activeCategoryIds);
  const hoveredNodeIdRef = useRef<string | null>(hoveredNodeId);
  const focusedNodeIdRef = useRef<string | null>(focusedNodeId);
  const searchMatchesRef = useRef<ReadonlySet<string>>(searchMatches);
  const renderRef = useRef<() => void>(() => {});
  const logoCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const lastDraggedNodeIdRef = useRef<string | null>(null);
  const tooltipId = useId();

  const themeMode = useMemo(() => getThemeMode(resolvedTheme), [resolvedTheme]);
  const legendEntries = useMemo(
    () => Object.entries(INDICATOR_VISUALS) as [ProjectIndicator, IndicatorVisual][],
    [],
  );

  // Layout updates when viewport changes
  useEffect(() => {
    const canvasWrapper = canvasWrapperRef.current;
    if (!canvasWrapper) {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "none";
      }
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== canvasWrapper) {
          continue;
        }
        const contentBox = entry.contentBoxSize?.[0];
        const width = contentBox ? contentBox.inlineSize : entry.contentRect.width;
        const height = contentBox ? contentBox.blockSize : entry.contentRect.height;
        if (width > 0 && height > 0) {
          setViewport({ width, height });
        }
      }
    });
    observer.observe(canvasWrapper);
    return () => observer.disconnect();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return;
    }
    const pixelRatio = window.devicePixelRatio || 1;
    const width = layout.width || DEFAULT_LAYOUT_WIDTH;
    const height = layout.height || DEFAULT_LAYOUT_HEIGHT;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    renderProjectMap({
      renderContext: {
        canvas,
        context,
        pixelRatio,
        width,
        height,
      },
      categories: categoriesRef.current,
      nodes: nodesRef.current,
      edges: edgesRef.current,
      transform: transformRef.current,
      filters: {
        activeCategoryIds: activeCategoryIdsRef.current,
        highlightedNodeId: hoveredNodeIdRef.current,
        focusedNodeId: focusedNodeIdRef.current,
        searchMatches: searchMatchesRef.current,
      },
      theme: { mode: themeMode },
    });

  }, [layout.height, layout.width, themeMode]);

  useEffect(() => {
    renderRef.current = render;
    renderRef.current();
    if (!viewport) {
      return;
    }
    const layoutResult: ProjectMapLayout = createProjectMapLayout({
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      categories: Object.keys(sourceCategories),
    });
    setLayout(layoutResult);
    categoriesRef.current = layoutResult.categories.map((category) => ({ ...category }));
    nodesRef.current = layoutResult.nodes.map((node) => ({ ...node }));
    edgesRef.current = layoutResult.edges.map((edge) => ({ ...edge }));
    simulationRef.current?.stop();
    simulationRef.current = new ProjectMapSimulation({
      layout: layoutResult,
      edges: layoutResult.edges,
      nodes: nodesRef.current,
      onTick: () => {
        requestAnimationFrame(() => render());
      },
    });
    simulationRef.current.start();
    setTransform({ zoom: 1, translateX: 0, translateY: 0 });
    setSearchMatches(new Set(nodesRef.current.map((node) => node.id)));
    renderRef.current();
  }, [viewport, render]);

  // Initialize search matches when layout changes
  useEffect(() => {
    const matches = computeSearchMatches(nodesRef.current, searchQuery);
    setSearchMatches(matches);
  }, [layout.nodes, searchQuery]);

  // Parse query params on load
  useEffect(() => {
    if (parsedQueryRef.current) {
      return;
    }
    const parsed = parseQueryState(searchParams);
    if (parsed.categories.length > 0) {
      setActiveCategoryIds(parsed.categories);
    }
    if (parsed.search.length > 0) {
      setSearchQuery(parsed.search);
    }
    if (parsed.zoom) {
      setTransform((current) => ({
        zoom: clampZoom(parsed.zoom ?? current.zoom),
        translateX: current.translateX,
        translateY: current.translateY,
      }));
    }
    if (parsed.focus) {
      const category = findCategoryByTitle(categoriesRef.current, parsed.focus);
      if (category) {
        setActiveCategoryIds([category.id]);
        setFocusedNodeId(null);
      }
    }
    parsedQueryRef.current = true;
  }, [searchParams]);

  // Update query params when filter/search/zoom change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeCategoryIds.length > 0) {
      params.set("cat", activeCategoryIds.join(","));
    } else {
      params.delete("cat");
    }
    if (searchQuery.trim().length > 0) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    params.set("zoom", transform.zoom.toFixed(2));
    const focusCategory = activeCategoryIds.length === 1
      ? categoriesRef.current.find((category) => category.id === activeCategoryIds[0])?.title
      : null;
    if (focusCategory) {
      params.set("focus", focusCategory);
    } else {
      params.delete("focus");
    }
    setSearchParams(params, { replace: true });
  }, [activeCategoryIds, searchParams, searchQuery, setSearchParams, transform.zoom]);


  useEffect(() => {
    renderRef.current();
  }, [render]);

  useEffect(() => {
    transformRef.current = transform;
    renderRef.current();
  }, [transform]);

  useEffect(() => {
    activeCategoryIdsRef.current = activeCategoryIds;
    renderRef.current();
  }, [activeCategoryIds]);

  useEffect(() => {
    hoveredNodeIdRef.current = hoveredNodeId;
    renderRef.current();
  }, [hoveredNodeId]);

  useEffect(() => {
    focusedNodeIdRef.current = focusedNodeId;
    renderRef.current();
  }, [focusedNodeId]);

  useEffect(() => {
    searchMatchesRef.current = searchMatches;
    renderRef.current();
  }, [searchMatches]);

  const applyZoomBehavior = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const zoomBehavior: ZoomBehavior<HTMLCanvasElement, unknown> = d3Zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .wheelDelta((event) => {
        const baseDelta = -event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.002);
        return baseDelta;
      })
      .on("start", () => setIsPanning(true))
      .on("zoom", (event) => {
        const nextTransform = toTransform(event.transform);
        setTransform(nextTransform);
        render();
      })
      .on("end", () => {
        setIsPanning(false);
        trackEvent({ event: "zoom_changed", payload: { zoom: transform.zoom.toFixed(2) } });
      });

    const selection = select<HTMLCanvasElement, unknown>(canvas);
    selection.call(zoomBehavior as ZoomBehavior<HTMLCanvasElement, unknown>);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      selection.on("zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [render, transform.zoom]);

  useEffect(() => {
    const cleanup = applyZoomBehavior();
    return () => {
      cleanup?.();
    };
  }, [applyZoomBehavior]);

  const scheduleTooltip = useCallback((node: ProjectMapNode | null, anchorX: number, anchorY: number) => {
    if (!node) {
      setTooltip(null);
      return;
    }
    const wrapper = canvasWrapperRef.current;
    const tooltipElement = tooltipRef.current;
    if (!wrapper || !tooltipElement) {
      setTooltip({ nodeId: node.id, anchorX, anchorY });
      return;
    }
    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const width = tooltipRect.width || tooltipElement.offsetWidth || 260;
    const height = tooltipRect.height || tooltipElement.offsetHeight || 120;

    let offsetX = anchorX + TOOLTIP_OFFSET;
    let offsetY = anchorY + TOOLTIP_OFFSET;

    const wrapperWidth = wrapperRect.width;
    const wrapperHeight = wrapperRect.height;

    if (offsetX + width > wrapperWidth) {
      offsetX = anchorX - TOOLTIP_OFFSET - width;
    }
    if (offsetY + height > wrapperHeight) {
      offsetY = anchorY - TOOLTIP_OFFSET - height;
    }
    if (offsetX < 0) {
      offsetX = Math.max(0, anchorX + TOOLTIP_OFFSET);
    }
    if (offsetY < 0) {
      offsetY = Math.max(0, anchorY + TOOLTIP_OFFSET);
    }

    setTooltip({ nodeId: node.id, anchorX: offsetX, anchorY: offsetY });
  }, []);

  const calculateLocalPoint = useCallback((clientX: number, clientY: number): { readonly x: number; readonly y: number } => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) {
      return { x: clientX, y: clientY };
    }
    const rect = wrapper.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const loadLogoImage = useCallback((node: ProjectMapNode) => {
    if (typeof window === "undefined" || !node.logoSrc || node.logoImage) {
      return;
    }
    const cache = logoCacheRef.current;
    const cached = cache.get(node.logoSrc);
    if (cached) {
      node.logoImage = cached;
      return;
    }
    const image = new Image();
    image.onload = () => {
      cache.set(node.logoSrc as string, image);
      node.logoImage = image;
      renderRef.current();
    };
    image.onerror = () => {
      cache.delete(node.logoSrc as string);
    };
    image.src = node.logoSrc;
  }, []);

  useEffect(() => {
    nodesRef.current.forEach((node) => loadLogoImage(node));
  }, [layout.nodes, loadLogoImage]);

  useEffect(() => {
    if (!tooltipRef.current || !tooltip) {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "none";
      }
      return;
    }
    const node = nodesRef.current.find((candidate) => candidate.id === tooltip.nodeId);
    if (!node) {
      return;
    }
    const tooltipElement = tooltipRef.current;
    tooltipElement.textContent = node.description ?? "No description provided.";
    tooltipElement.setAttribute("data-label", node.name);
    tooltipElement.setAttribute("data-indicator", node.indicator);
    tooltipElement.style.transform = `translate3d(${tooltip.anchorX}px, ${tooltip.anchorY}px, 0)`;
    tooltipElement.style.display = "block";
  }, [tooltip]);

  const handleHoverNode = useCallback((
    nodeId: string | null,
    event: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLSpanElement> | React.PointerEvent<HTMLSpanElement> | null,
  ) => {
    setHoveredNodeId(nodeId);
    if (nodeId && event) {
      const node = nodesRef.current.find((candidate) => candidate.id === nodeId) ?? null;
      if (!node) {
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
      const anchorX = rect.left + rect.width / 2 - (wrapperRect?.left ?? 0);
      const anchorY = rect.top + rect.height / 2 - (wrapperRect?.top ?? 0);
      scheduleTooltip(node, anchorX, anchorY);
    } else {
      scheduleTooltip(null, 0, 0);
    }
  }, [scheduleTooltip]);

  const handleFocusNode = useCallback((nodeId: string, event?: React.FocusEvent<HTMLButtonElement>) => {
    setFocusedNodeId(nodeId);
    const node = nodesRef.current.find((candidate) => candidate.id === nodeId);
    if (!node) {
      return;
    }
    trackEvent({
      event: "focus_node",
      payload: {
        id: node.id,
        category: node.categoryTitle,
      },
    });
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const wrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
      const anchorX = rect.left + rect.width / 2 - (wrapperRect?.left ?? 0);
      const anchorY = rect.top + rect.height / 2 - (wrapperRect?.top ?? 0);
      scheduleTooltip(node, anchorX, anchorY);
    }
  }, [scheduleTooltip]);

  const handleBlurNode = useCallback(() => {
    setFocusedNodeId(null);
    handleHoverNode(null, null);
  }, [handleHoverNode]);

  const applyCategoryFilter = useCallback((categoryId: string) => {
    setActiveCategoryIds((previous) => {
      if (previous.length === 1 && previous[0] === categoryId) {
        return [];
      }
      return [categoryId];
    });
    trackEvent({ event: "filter_category", payload: { categoryId } });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      const matches = computeSearchMatches(nodesRef.current, value);
      setSearchMatches(matches);
      trackEvent({ event: "search_query", payload: { query: value } });
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, []);

  const resetView = useCallback(() => {
    if (canvasRef.current && zoomBehaviorRef.current) {
      const nextTransform = zoomIdentity.translate(0, 0).scale(1);
      select(canvasRef.current).call(zoomBehaviorRef.current.transform, nextTransform);
    } else {
      setTransform({ zoom: 1, translateX: 0, translateY: 0 });
    }
    setActiveCategoryIds([]);
    setSearchQuery("");
    setSearchMatches(new Set(nodesRef.current.map((node) => node.id)));
    setFocusedNodeId(null);
    setHoveredNodeId(null);
    scheduleTooltip(null, 0, 0);
  }, [scheduleTooltip]);

  const openNodeUrl = useCallback((node: ProjectMapNode) => {
    const sanitized = sanitizeUrl(node.url);
    window.open(sanitized, "_blank", "noopener,noreferrer");
    trackEvent({
      event: "click_project",
      payload: {
        name: node.name,
        category: node.categoryTitle,
        indicator: node.indicator,
      },
    });
  }, []);

  const findNodeById = useCallback((nodeId: string): ProjectMapNode | undefined => {
    return nodesRef.current.find((node) => node.id === nodeId);
  }, []);

  const updateNodePositionForPointer = useCallback((node: ProjectMapNode, clientX: number, clientY: number) => {
    const currentTransform = transformRef.current;
    const localPoint = calculateLocalPoint(clientX, clientY);
    const localX = (localPoint.x - currentTransform.translateX) / currentTransform.zoom;
    const localY = (localPoint.y - currentTransform.translateY) / currentTransform.zoom;
    const category = categoriesRef.current.find((candidate) => candidate.id === node.categoryId);
    node.x = localX;
    node.y = localY;
    if (category) {
      clampNodeToCategory(node, category, layout.width, layout.height);
    } else {
      clampNodeToViewport(node, layout.width, layout.height);
    }
    node.fx = node.x;
    node.fy = node.y;
    node.vx = 0;
    node.vy = 0;
  }, [calculateLocalPoint, layout.height, layout.width]);

  const handlePointerDown = useCallback((nodeId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    const node = findNodeById(nodeId);
    if (!node) {
      return;
    }
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      nodeId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    lastDraggedNodeIdRef.current = null;
    simulationRef.current?.pause();
    updateNodePositionForPointer(node, event.clientX, event.clientY);
    simulationRef.current?.poke();
    setIsDragging(true);
    scheduleTooltip(null, 0, 0);
    event.preventDefault();
  }, [findNodeById, updateNodePositionForPointer]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }
    const node = findNodeById(dragState.nodeId);
    if (!node) {
      return;
    }
    updateNodePositionForPointer(node, event.clientX, event.clientY);
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) > DRAG_MOVE_THRESHOLD) {
      dragState.moved = true;
    }
    simulationRef.current?.poke();
    render();
  }, [findNodeById, render, updateNodePositionForPointer]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }
    if (event.pointerId !== dragState.pointerId) {
      return;
    }
    const node = findNodeById(dragState.nodeId);
    if (node) {
      node.fx = undefined;
      node.fy = undefined;
    }
    if (dragState.moved) {
      lastDraggedNodeIdRef.current = dragState.nodeId;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setIsDragging(false);
    simulationRef.current?.resume();
    simulationRef.current?.poke();
  }, [findNodeById]);

  const handleKeyDown = useCallback((nodeId: string, event: React.KeyboardEvent<HTMLButtonElement>) => {
    const node = findNodeById(nodeId);
    if (!node) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openNodeUrl(node);
      return;
    }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const deltaX = event.key === "ArrowLeft" ? -KEYBOARD_NUDGE : event.key === "ArrowRight" ? KEYBOARD_NUDGE : 0;
      const deltaY = event.key === "ArrowUp" ? -KEYBOARD_NUDGE : event.key === "ArrowDown" ? KEYBOARD_NUDGE : 0;
      node.x += deltaX;
      node.y += deltaY;
      const category = categoriesRef.current.find((candidate) => candidate.id === node.categoryId);
      if (category) {
        clampNodeToCategory(node, category, layout.width, layout.height);
      } else {
        clampNodeToViewport(node, layout.width, layout.height);
      }
      simulationRef.current?.poke();
      render();
    }
  }, [findNodeById, layout.height, layout.width, openNodeUrl, render]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      return;
    }
    const now = Date.now();
    if (doubleTapRef.current && now - doubleTapRef.current < DOUBLE_TAP_TIMEOUT_MS) {
      const localPoint = calculateLocalPoint(event.clientX, event.clientY);
      const localX = (localPoint.x - transform.translateX) / transform.zoom;
      const localY = (localPoint.y - transform.translateY) / transform.zoom;
      const category = categoriesRef.current.find((candidate) => pointInPolygon({ x: localX, y: localY }, candidate.polygon));
      if (category) {
        setActiveCategoryIds([category.id]);
        setFocusedNodeId(null);
        const focusZoom = clampZoom(Math.max(transform.zoom, 1.35));
        const translateX = (layout.width / 2) - category.centroid[0] * focusZoom;
        const translateY = (layout.height / 2) - category.centroid[1] * focusZoom;
        if (canvasRef.current && zoomBehaviorRef.current) {
          const nextTransform = zoomIdentity.translate(translateX, translateY).scale(focusZoom);
          select(canvasRef.current).call(zoomBehaviorRef.current.transform, nextTransform);
        } else {
          setTransform({ zoom: focusZoom, translateX, translateY });
        }
        trackEvent({ event: "focus_category", payload: { category: category.title } });
      }
      doubleTapRef.current = null;
      return;
    }
    doubleTapRef.current = now;
  }, [isDragging, layout.height, layout.width, transform.translateX, transform.translateY, transform.zoom]);

  const nodesForRendering = nodesRef.current;
  const categoryLegend = categoriesRef.current;

  return (
    <div
      className={`${styles.container} rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-500/20 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-slate-900/40 sm:p-8`}
      ref={containerRef}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={`${styles.controls} rounded-2xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur-md transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/60 sm:p-5`}
      >
        <div className={styles.filterScroll}>
          {categoriesRef.current.map((category) => {
            const isActive = activeCategoryIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                className={isActive ? styles.activeChip : styles.chip}
                onClick={() => applyCategoryFilter(category.id)}
                style={{
                  borderColor: category.color,
                  color: isActive ? category.textColor : category.color,
                  background: isActive ? category.color : "transparent",
                }}
              >
                {category.title}
                <span className={styles.chipCount}>{category.projectCount}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.searchBar}>
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="rounded-full border border-slate-200/70 bg-white/70 p-2 backdrop-blur-md transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/60"
          />
          <button type="button" onClick={resetView} className={`${styles.resetButton} bg-slate-200/70 dark:bg-slate-700/70 mt-10 ml-auto flex items-center`}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset view
          </button>
        </div>
      </div>
      <div className={styles.canvasWrapper} ref={canvasWrapperRef}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.overlay}>
          {nodesForRendering.map((node) => {
            const categoryActive = activeCategoryIds.length === 0 || activeCategoryIds.includes(node.categoryId);
            const matches = searchMatches.has(node.id);
            const interactive = categoryActive && matches;
            const screenPosition = computeNodeScreenPosition(node, transform);
            const size = Math.max(MIN_TAP_TARGET, node.radius * 2 * transform.zoom);
            return (
              <button
                key={node.id}
                type="button"
                className={styles.nodeButton}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: `translate3d(${screenPosition.x - size / 2}px, ${screenPosition.y - size / 2}px, 0)`,
                  opacity: interactive ? 1 : 0.15,
                  pointerEvents: interactive ? "auto" : "none",
                  zIndex: hoveredNodeId === node.id ? 10 : 1,
                }}
                aria-label={`Open ${node.name}: ${node.description ?? "No description provided."}`}
                aria-describedby={tooltip?.nodeId === node.id ? tooltipId : undefined}
                aria-hidden={interactive ? undefined : "true"}
                tabIndex={interactive ? 0 : -1}
                onPointerDown={(event) => handlePointerDown(node.id, event)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={() => handleHoverNode(null, null)}
                onMouseEnter={(event) => handleHoverNode(node.id, event)}
                onMouseMove={(event) => handleHoverNode(node.id, event)}
                onMouseLeave={() => handleHoverNode(null, null)}
                onFocus={(event) => handleFocusNode(node.id, event)}
                onBlur={handleBlurNode}
                onKeyDown={(event) => handleKeyDown(node.id, event)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (lastDraggedNodeIdRef.current === node.id) {
                    lastDraggedNodeIdRef.current = null;
                    return;
                  }
                  lastDraggedNodeIdRef.current = null;
                  if (interactive) {
                    openNodeUrl(node);
                  }
                }}
              />
            );
          })}
        </div>
        <div
          ref={tooltipRef}
          id={tooltipId}
          className={styles.tooltip}
          role="status"
          aria-live="polite"
        />
      </div>
      <section className="bg-white/80 p-3 dark:bg-slate-900/70">
        <header>
          <h3 className="text-slate-900 dark:text-white font-semibold uppercase">Indicator legend</h3>
        </header>
        <div className={`${styles.legendGrid}`}>
          {legendEntries.map(([indicator, visual]) => (
            <div key={indicator} className={`${styles.legendItem} bg-white/80 dark:bg-slate-900/70 text-slate-900 dark:text-white`}>
              <span
                className={styles.legendBadge}
                style={{
                  borderStyle: visual.ringStyle === "dashed" ? "dashed" : visual.ringStyle === "segmented" ? "dotted" : "solid",
                  borderColor: visual.ringColor,
                }}
              />
              <div>
                <p className={`${styles.legendTitle} text-slate-900 dark:text-white`}>
                  {indicator === "onchain" && "On-chain"}
                  {indicator === "hybrid" && "Hybrid"}
                  {indicator === "support" && "Support"}
                </p>
                <p className={`${styles.legendDescription} text-slate-900 dark:text-white`}>
                  {visual.ringStyle === "solid" && "Thick solid ring with green dot"}
                  {visual.ringStyle === "segmented" && "Segmented amber ring"}
                  {visual.ringStyle === "dashed" && "Thin grey dashed ring"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProjectMap;
