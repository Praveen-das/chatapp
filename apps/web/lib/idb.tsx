"use client";

import { DBSchema, IDBPDatabase, openDB } from "idb";
import { useCallback, useEffect, useState } from "react";

interface MyDB extends DBSchema {
  kv_store: {
    key: string;
    value: boolean;
  };
}

export default function useIndexedDb() {
  const [db, setDb] = useState<IDBPDatabase<MyDB> | null>(null);

  useEffect(() => {
    (async () => {
      const idb = await openDB<MyDB>("idb", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("kv_store")) {
            db.createObjectStore("kv_store");
          }
        },
      });
      setDb(idb);
    })();
  }, []);

  const get = async (key: string) => {
    return db?.get("kv_store", key);
  }

  const set = async (key: string, val: boolean) => {
    return db?.put("kv_store", val, key);
  }

  const del = async (key: string) => {
    return db?.delete("kv_store", key);
  }

  const clear = async () => {
    return db?.clear("kv_store");
  }

  const keys = async () => {
    return db?.getAllKeys("kv_store");
  }

  return {
    get,
    set,
    del,
    clear,
    keys,
  };
}
