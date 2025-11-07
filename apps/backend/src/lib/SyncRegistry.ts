import client from "../redis/client";
import SyncRegistryCreator from "../redis/SyncRegistryCreator";

export const syncRegistry = new SyncRegistryCreator(client)