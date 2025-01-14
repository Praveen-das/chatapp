import { DBSchema, openDB } from "idb";

type IValue = {
  userId: string;
  canSendNotifications: boolean;
};

interface MyDB extends DBSchema {
  kv_store: {
    key: string;
    value: boolean;
    // indexes: { userId: string };
  };
}

const db = openDB<MyDB>("idb", 1, {
  upgrade(db) {
    db.createObjectStore("kv_store");
  },
});

async function get(key: string) {
  return (await db).get("kv_store", key);
}
async function set(key: string, val: boolean) {
  return (await db).put("kv_store", val, key);
}
async function del(key: string) {
  return (await db).delete("kv_store", key);
}
async function clear() {
  return (await db).clear("kv_store");
}
async function keys() {
  return (await db).getAllKeys("kv_store");
}

export default{
    get,set,del,clear,keys
}
