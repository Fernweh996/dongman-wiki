/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'force-graph' {
  interface ForceGraphInstance {
    graphData(data: { nodes: any[]; links: any[] }): ForceGraphInstance
    backgroundColor(color: string): ForceGraphInstance
    d3AlphaDecay(decay: number): ForceGraphInstance
    d3VelocityDecay(decay: number): ForceGraphInstance
    warmupTicks(ticks: number): ForceGraphInstance
    cooldownTicks(ticks: number): ForceGraphInstance
    enableNodeDrag(enable: boolean): ForceGraphInstance
    enableZoomInteraction(enable: boolean): ForceGraphInstance
    nodeCanvasObject(fn: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void): ForceGraphInstance
    nodePointerAreaPaint(fn: (node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => void): ForceGraphInstance
    linkCanvasObject(fn: (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => void): ForceGraphInstance
    onNodeClick(fn: (node: any) => void): ForceGraphInstance
    onNodeHover(fn: (node: any | null) => void): ForceGraphInstance
    d3Force(name: string): any
    zoomToFit(duration: number, padding: number): ForceGraphInstance
    width(w: number): ForceGraphInstance
    height(h: number): ForceGraphInstance
    _destructor?: () => void
  }

  function ForceGraph(): (element: HTMLElement) => ForceGraphInstance
  export default ForceGraph
}
