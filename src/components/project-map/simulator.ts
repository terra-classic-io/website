import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  forceLink,
  Simulation,
  type SimulationLinkDatum,
} from "d3-force";
import type { ProjectMapCategory, ProjectMapEdge, ProjectMapLayout, ProjectMapNode } from "./types";
import { clampNodeToCategory } from "./geometry";
import {
  CLUSTER_LINK_DISTANCE,
  CLUSTER_LINK_STRENGTH,
  CROSS_CATEGORY_CHARGE,
  DRAG_SPRING_STRENGTH,
  SIMULATION_FREEZE_DELAY_MS,
} from "./constants";

interface ProjectMapSimulationConfig {
  readonly layout: ProjectMapLayout;
  readonly edges: readonly ProjectMapEdge[];
  readonly nodes: ProjectMapNode[];
  readonly onTick: () => void;
}

export class ProjectMapSimulation {
  private readonly layout: ProjectMapLayout;

  private readonly edges: readonly ProjectMapEdge[];

  private readonly links: SimulationLinkDatum<ProjectMapNode>[];

  private readonly onTick: () => void;

  private readonly nodes: ProjectMapNode[];

  private readonly categoriesById: Map<string, ProjectMapCategory>;

  private simulation: Simulation<ProjectMapNode, undefined> | null;

  private freezeTimeout: ReturnType<typeof setTimeout> | null;

  private isPaused: boolean;

  public constructor(config: ProjectMapSimulationConfig) {
    this.layout = config.layout;
    this.nodes = config.nodes;
    this.edges = config.edges;
    this.links = this.edges.map((edge) => ({
      source: edge.source,
      target: edge.target ?? edge.source,
    }));
    this.categoriesById = new Map(config.layout.categories.map((category) => [category.id, category]));
    this.onTick = config.onTick;
    this.simulation = null;
    this.freezeTimeout = null;
    this.isPaused = false;
  }

  public getNodes(): readonly ProjectMapNode[] {
    return this.nodes;
  }

  public start(): void {
    if (this.simulation) {
      this.isPaused = false;
      this.simulation.alpha(0.7).restart();
      this.scheduleFreeze();
      return;
    }

    this.simulation = forceSimulation<ProjectMapNode>(this.nodes)
      .force(
        "link",
        forceLink<ProjectMapNode, SimulationLinkDatum<ProjectMapNode>>(this.links)
          .id((node) => node.id)
          .distance(CLUSTER_LINK_DISTANCE)
          .strength(CLUSTER_LINK_STRENGTH),
      )
      .force(
        "x",
        forceX<ProjectMapNode>((node) => this.categoriesById.get(node.categoryId)?.centroid[0] ?? node.x).strength(
          DRAG_SPRING_STRENGTH,
        ),
      )
      .force(
        "y",
        forceY<ProjectMapNode>((node) => this.categoriesById.get(node.categoryId)?.centroid[1] ?? node.y).strength(
          DRAG_SPRING_STRENGTH,
        ),
      )
      .force(
        "collide",
        forceCollide<ProjectMapNode>((node) => node.radius + 6).strength(1.0).iterations(3),
      )
      .force(
        "charge",
        forceManyBody<ProjectMapNode>()
          .strength(() => CROSS_CATEGORY_CHARGE)
          .distanceMax(CLUSTER_LINK_DISTANCE * 4),
      )
      .on("tick", () => this.handleTick());

    this.isPaused = false;
    this.scheduleFreeze();
  }

  public poke(): void {
    if (this.simulation && !this.isPaused) {
      this.simulation.alpha(0.4).restart();
    }
    this.scheduleFreeze();
  }

  public pause(): void {
    if (!this.simulation || this.isPaused) {
      return;
    }
    this.simulation.stop();
    this.isPaused = true;
    if (this.freezeTimeout) {
      clearTimeout(this.freezeTimeout);
      this.freezeTimeout = null;
    }
  }

  public resume(): void {
    if (!this.simulation) {
      this.start();
      return;
    }
    this.isPaused = false;
    this.simulation.alpha(0.5).restart();
    this.scheduleFreeze();
  }

  public stop(): void {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    if (this.freezeTimeout) {
      clearTimeout(this.freezeTimeout);
      this.freezeTimeout = null;
    }
  }

  private handleTick(): void {
    const width = this.layout.width;
    const height = this.layout.height;

    for (const node of this.nodes) {
      const category = this.categoriesById.get(node.categoryId);
      if (category) {
        clampNodeToCategory(node, category, width, height);
      } else {
        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
      }
    }

    this.onTick();
  }

  private scheduleFreeze(): void {
    if (this.freezeTimeout) {
      clearTimeout(this.freezeTimeout);
    }
    this.freezeTimeout = setTimeout(() => {
      if (this.simulation && !this.isPaused) {
        this.simulation.stop();
      }
      this.freezeTimeout = null;
    }, SIMULATION_FREEZE_DELAY_MS);
  }
}
