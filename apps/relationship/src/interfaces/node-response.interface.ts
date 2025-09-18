/**
 * Interface representing a Neo4j node response structure
 * Contains the standard Neo4j node properties including identity, labels, properties, and elementId
 */
export interface NodeResponse<T = any> {
  /** Neo4j node identity with low and high integer values */
  identity: {
    low: number;
    high: number;
  };

  /** Array of node labels (e.g., ['User']) */
  labels: string[];

  /** Node properties containing the actual data */
  properties: T;

  /** Neo4j element identifier string */
  elementId: string;
}
