import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "../../app/supabaseClient";

interface Nodes {
  id: number;
  places1_id: string;
  places2_id: string;
  distance: number;
  status: boolean;
}

interface Places {
  id: number;
  places_name: string;
  latitude: number;
  longitude: number;
  total_nodes: number;
}

type Graph = {
  [key: string]: {
      [key: string]: number;
  };
};

class PriorityQueue<T> {
  private items: {element: T, priority: number}[] = [];
  
  enqueue(element: T, priority: number): void {
      let added = false;
      for (let i = 0; i < this.items.length; i++) {
          if (priority < this.items[i].priority) {
              this.items.splice(i, 0, {element, priority});
              added = true;
              break;
          }
      }
      if (!added) this.items.push({element, priority});
  }
  
  dequeue(): T | undefined {
      return this.items.shift()?.element;
  }

  isEmpty(): boolean {
      return !this.items.length;
  }
}

function dijkstra(graph: Graph, start: string, end: string): string[] | null {
  const visited: {[key: string]: boolean} = {};
  const distances: {[key: string]: number} = {};
  const previous: {[key: string]: string | null} = {};

  const nodes = new PriorityQueue<string>();

  for (const vertex in graph) {
      if (vertex === start) {
          distances[vertex] = 0;
          nodes.enqueue(vertex, 0);
      } else {
          distances[vertex] = Infinity;
          nodes.enqueue(vertex, Infinity);
      }
      previous[vertex] = null;
  }

  while (!nodes.isEmpty()) {
      const smallest = nodes.dequeue();

      if (!smallest || distances[smallest] === Infinity) continue;

      for (const neighbor in graph[smallest]) {
          const alt = distances[smallest] + graph[smallest][neighbor];

          if (alt < distances[neighbor]) {
              distances[neighbor] = alt;
              previous[neighbor] = smallest;
              nodes.enqueue(neighbor, alt);
          }
      }
      visited[smallest] = true;
      if (smallest === end) {
          const path = [];
          let current: string | null = end;

          while (current) {
              path.unshift(current);
              current = previous[current];
          }
          return path;
      }
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    const { id, status } = req.body;
    if (!id || typeof status !== "boolean") {
      return res.status(400).json({ error: "ID and status are required." });
    }

    const { error } = await supabase
      .from("distance")
      .update({ status })
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Status updated successfully." });
  } else if (req.method === "GET") {
    const { startId, endId } = req.query as { startId: string; endId: string };

    if (
      !startId ||
      !endId ||
      typeof startId !== "string" ||
      typeof endId !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "startId and endId are required and must be strings." });
    }

    // Fetch data from Supabase
    const { data } = await supabase.from("distance").select();
    const { data: placesData } = await supabase.from("places").select();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No route data found." });
    }

    if (!placesData || placesData.length === 0) {
      return res.status(404).json({ error: "No places data found." });
    }

    const graph: { [key: string]: { [key: string]: number } } = {};

    // Initialize the graph considering the status
    data.forEach((distance: Nodes) => {
      if (distance.status) {
        if (!graph[distance.places1_id]) {
          graph[distance.places1_id] = {};
        }
        if (!graph[distance.places2_id]) {
          graph[distance.places2_id] = {};
        }
        graph[distance.places1_id][distance.places2_id] = distance.distance;
        graph[distance.places2_id][distance.places1_id] = distance.distance;
      }
    });

    const path = dijkstra(graph, startId, endId);

    // For each path (id), get the data then compose to object
    const pathResult: Places[] = [];
    path?.forEach((id) => {
      const place = placesData.find((place: Places) => place.id === Number(id));

      if (place) {
        pathResult.push(place);
      }
    });

    return res.status(200).json(pathResult);
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
