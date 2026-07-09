/**
 * @file index.ts
 * @description @tra/map-builder 패키지 공개 API
 */

export { MAP_HIERARCHY_REGISTRY, findRegionNodeByCoords } from './MapRegistry.js';
export type { MapRegionNode } from './MapRegistry.js';

export { TileExporter } from './TileExporter.js';
export type { TileTerrainType, TileMeta, MapExportData } from './TileExporter.js';
