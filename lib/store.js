let db = {};

export function saveData(id, data) {
  db[id] = data;
}

export function getData(id) {
  return db[id];
}