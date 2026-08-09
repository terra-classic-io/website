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
import { ProjectIndicator, projects } from "../../data/projects";
import { categories as sourceCategories } from "../../data/categories";
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
import ProjectDirectoryView from "./project-directory-view";
import styles from "./project-map.module.css";
import { ArrowUpRight, LayoutGrid, Network, RefreshCcw } from "lucide-react";

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

type ProjectViewMode = "bubble" | "directory";

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ProjectViewMode>("directory");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [_, setIsPanning] = useState<boolean>(false);
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
    const originalSrc = node.logoSrc;
    const requestLogo = (src: string, allowRetry: boolean): void => {
      const image = new Image();
      image.onload = () => {
        cache.set(originalSrc, image);
        node.logoImage = image;
        renderRef.current();
      };
      image.onerror = () => {
        cache.delete(originalSrc);
        if (allowRetry) {
          const separator = originalSrc.includes("?") ? "&" : "?";
          requestLogo(`${originalSrc}${separator}image-retry=${Date.now()}`, false);
        }
      };
      image.src = src;
    };
    requestLogo(originalSrc, true);
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
  }, [findNodeById, scheduleTooltip, updateNodePositionForPointer]);

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
  }, [isDragging, layout.height, layout.width, transform.translateX, transform.translateY, transform.zoom, calculateLocalPoint]);

  const nodesForRendering = nodesRef.current;
  const selectedNode = nodesForRendering.find((node) => node.id === selectedNodeId)
    ?? nodesForRendering.find((node) => node.name.toLowerCase() === "terraswap")
    ?? nodesForRendering.find((node) => node.url.length > 0);
  const selectedLogo = selectedNode?.logoSrc?.replace(/^\/public/, "");

  const selectViewMode = (nextMode: ProjectViewMode): void => {
    setViewMode(nextMode);
    trackEvent({ event: "project_view_changed", payload: { view: nextMode } });
  };

  return (
    <div
      className={`${styles.container} rounded-2xl border border-slate-200 bg-white/75 p-3 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/[0.02] sm:p-4`}
      ref={containerRef}
      onDoubleClick={viewMode === "bubble" ? handleDoubleClick : undefined}
    >
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-white/10 dark:bg-[#061121]/90 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Project view</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Explore visually or browse the classic directory.</p>
        </div>
        <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.03]" role="group" aria-label="Project view mode">
          <button
            type="button"
            onClick={() => selectViewMode("directory")}
            aria-pressed={viewMode === "directory"}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition ${viewMode === "directory" ? "bg-white text-blue-600 shadow-sm dark:bg-blue-500/15 dark:text-blue-300" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
          >
            <LayoutGrid size={15} />
            Directory
          </button>
          <button
            type="button"
            onClick={() => selectViewMode("bubble")}
            aria-pressed={viewMode === "bubble"}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition ${viewMode === "bubble" ? "bg-white text-blue-600 shadow-sm dark:bg-blue-500/15 dark:text-blue-300" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
          >
            <Network size={15} />
            Bubble map
          </button>
        </div>
      </div>
      <div
        className={`${styles.controls} rounded-xl border border-slate-200 bg-white/90 p-4 backdrop-blur-md transition-colors duration-300 dark:border-white/10 dark:bg-[#061121]/90`}
      >
        <div className={styles.filterScroll}>
          <button
            type="button"
            className={activeCategoryIds.length === 0 ? styles.activeChip : styles.chip}
            onClick={() => setActiveCategoryIds([])}
          >
            All categories
            <span className={styles.chipCount}>{projects.length}</span>
          </button>
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
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="rounded-full border border-slate-200/70 bg-white/70 p-2 backdrop-blur-md transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/60"
          />
          <button type="button" onClick={resetView} className={`${styles.resetButton} flex items-center`}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset view
          </button>
        </div>
      </div>
      <div className={viewMode === "bubble" ? styles.workspace : "hidden"}>
        <div className={styles.mapPanel}>
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
                      zIndex: hoveredNodeId === node.id ? 10 : selectedNode?.id === node.id ? 8 : 1,
                    }}
                    aria-label={`View details for ${node.name}: ${node.description ?? "No description provided."}`}
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
                        setSelectedNodeId(node.id);
                        trackEvent({ event: "select_project", payload: { name: node.name, category: node.categoryTitle } });
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
          <section className={styles.legendSection}>
            <header>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Indicator legend</h3>
            </header>
            <div className={styles.legendGrid}>
              {legendEntries.map(([indicator, visual]) => (
                <div key={indicator} className={styles.legendItem}>
                  <span
                    className={styles.legendBadge}
                    style={{
                      borderStyle: visual.ringStyle === "dashed" ? "dashed" : visual.ringStyle === "segmented" ? "dotted" : "solid",
                      borderColor: visual.ringColor,
                    }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-950 dark:text-white">
                      {indicator === "onchain" && "On-chain"}
                      {indicator === "hybrid" && "Hybrid"}
                      {indicator === "support" && "Support"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {visual.ringStyle === "solid" && "Native on-chain integration"}
                      {visual.ringStyle === "segmented" && "Hybrid ecosystem integration"}
                      {visual.ringStyle === "dashed" && "Terra Classic support"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.detailsPanel} aria-live="polite">
          {selectedNode ? (
            <>
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/5">
                  {selectedLogo ? <img src={selectedLogo} alt="" className="h-12 w-12 object-contain" /> : <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedNode.monogram}</span>}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{selectedNode.name}</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedNode.categoryTitle} · {selectedNode.description ?? "Ecosystem project"}</p>
                </div>
              </div>
              <p className="mt-8 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {selectedNode.description
                  ? `${selectedNode.name} is listed in the Terra Classic ecosystem directory as ${selectedNode.description.toLowerCase()}.`
                  : `${selectedNode.name} is part of the community-curated Terra Classic ecosystem directory.`}
              </p>
              <dl className="mt-8 divide-y divide-slate-200 border-y border-slate-200 text-xs dark:divide-white/10 dark:border-white/10">
                <div className="flex items-center justify-between py-4"><dt className="text-slate-500 dark:text-slate-400">Category</dt><dd className="font-semibold text-slate-950 dark:text-white">{selectedNode.categoryTitle}</dd></div>
                <div className="flex items-center justify-between py-4"><dt className="text-slate-500 dark:text-slate-400">Integration</dt><dd className="capitalize text-slate-950 dark:text-white">{selectedNode.indicator}</dd></div>
                <div className="flex items-center justify-between py-4"><dt className="text-slate-500 dark:text-slate-400">Status</dt><dd className="rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-600 dark:text-emerald-400">Listed</dd></div>
                <div className="flex items-center justify-between gap-4 py-4"><dt className="text-slate-500 dark:text-slate-400">Website</dt><dd className="min-w-0 truncate font-semibold text-blue-600 dark:text-blue-400">{selectedNode.url.replace(/^https?:\/\//, "")}</dd></div>
              </dl>
              <button type="button" onClick={() => openNodeUrl(selectedNode)} className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_-16px_rgba(37,99,235,0.75)] transition hover:bg-blue-500">
                View project details
                <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => selectViewMode("directory")}
                className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                Browse directory
                <LayoutGrid size={13} />
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a project to view its details.</p>
          )}
        </aside>
      </div>
      {viewMode === "directory" ? (
        <ProjectDirectoryView
          categories={layout.categories}
          activeCategoryIds={activeCategoryIds}
          searchQuery={searchQuery}
          onClearCategories={() => setActiveCategoryIds([])}
        />
      ) : null}
    </div>
  );
};

export default ProjectMap;
