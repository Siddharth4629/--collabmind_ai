const fs = require('fs');
const path = require('path');

const DB_FILE_PATH = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data folder exists
if (!fs.existsSync(path.dirname(DB_FILE_PATH))) {
  fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
}

// Initial empty DB structure
const initialDb = {
  users: [],
  projects: [],
  tasks: [],
  whiteboards: [],
  notes: [],
  chats: [],
  activities: []
};

// Load database from file
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading mock database file, resetting database:', err);
  }
  saveDb(initialDb);
  return initialDb;
}

// Save database to file
function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving mock database:', err);
  }
}

// Generate random hex ID
function generateId() {
  return Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
}

// Deep copy helper
function deepCopy(obj) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

// Simple query matcher
function matchesQuery(item, query) {
  if (!query) return true;
  for (const key in query) {
    const val = query[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Handle operators like $in, $ne
      if ('$in' in val) {
        if (!Array.isArray(val.$in)) continue;
        const itemVal = item[key];
        if (Array.isArray(itemVal)) {
          if (!itemVal.some(v => val.$in.includes(v))) return false;
        } else {
          if (!val.$in.includes(itemVal)) return false;
        }
      } else if ('$ne' in val) {
        if (item[key] === val.$ne) return false;
      }
    } else if (Array.isArray(val)) {
      // Check array matching
      if (JSON.stringify(item[key]) !== JSON.stringify(val)) return false;
    } else {
      // Standard direct check
      if (item[key] !== val) return false;
    }
  }
  return true;
}

class MockQuery {
  constructor(collectionName, query) {
    this.collectionName = collectionName;
    this.query = query;
    this.populatePaths = [];
    this.sortFields = null;
    this.selectFields = null;
  }

  populate(pathStr) {
    this.populatePaths.push(pathStr);
    return this;
  }

  sort(sortObj) {
    this.sortFields = sortObj;
    return this;
  }

  select(selectStr) {
    this.selectFields = selectStr;
    return this;
  }

  async exec() {
    const db = loadDb();
    const items = db[this.collectionName] || [];
    let results = items.filter(item => matchesQuery(item, this.query));

    // Sort results
    if (this.sortFields) {
      results.sort((a, b) => {
        for (const field in this.sortFields) {
          const dir = this.sortFields[field];
          if (a[field] < b[field]) return dir === 1 || dir === 'asc' ? -1 : 1;
          if (a[field] > b[field]) return dir === 1 || dir === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // Populate references
    for (const item of results) {
      await populateDoc(item, this.populatePaths);
    }

    // Wrap in document instances
    const wrapped = results.map(item => wrapDoc(this.collectionName, item));
    if (this._returnSingle) {
      return wrapped[0] || null;
    }
    return wrapped;
  }

  // Thenable to allow direct await without calling .exec()
  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }
}

// Populate reference fields on a document
async function populateDoc(item, paths) {
  if (!item) return;
  const db = loadDb();

  for (const pathStr of paths) {
    // E.g. 'members.user' or 'assignee' or 'project'
    const parts = pathStr.split('.');
    
    if (parts.length === 1) {
      const field = parts[0];
      const idVal = item[field];
      if (!idVal) continue;

      if (Array.isArray(idVal)) {
        // e.g. list of user IDs
        const refCollection = getRefCollection(field);
        if (refCollection && db[refCollection]) {
          item[field] = idVal.map(id => {
            const idStr = typeof id === 'object' && id._id ? id._id : id;
            const refDoc = db[refCollection].find(d => d._id === idStr);
            return refDoc ? deepCopy(refDoc) : id;
          });
        }
      } else {
        const idStr = typeof idVal === 'object' && idVal._id ? idVal._id : idVal;
        const refCollection = getRefCollection(field);
        if (refCollection && db[refCollection]) {
          const refDoc = db[refCollection].find(d => d._id === idStr);
          if (refDoc) {
            item[field] = deepCopy(refDoc);
          }
        }
      }
    } else if (parts.length === 2) {
      // E.g. 'members.user'
      const [parentField, childField] = parts;
      const parentVal = item[parentField];
      if (!parentVal) continue;

      const refCollection = getRefCollection(childField);
      if (!refCollection || !db[refCollection]) continue;

      if (Array.isArray(parentVal)) {
        for (const subItem of parentVal) {
          const idVal = subItem[childField];
          if (!idVal) continue;
          const idStr = typeof idVal === 'object' && idVal._id ? idVal._id : idVal;
          const refDoc = db[refCollection].find(d => d._id === idStr);
          if (refDoc) {
            subItem[childField] = deepCopy(refDoc);
          }
        }
      } else {
        const idVal = parentVal[childField];
        if (!idVal) continue;
        const idStr = typeof idVal === 'object' && idVal._id ? idVal._id : idVal;
        const refDoc = db[refCollection].find(d => d._id === idStr);
        if (refDoc) {
          parentVal[childField] = deepCopy(refDoc);
        }
      }
    }
  }
}

// Map schema fields to target collections
function getRefCollection(field) {
  const mapping = {
    user: 'users',
    users: 'users',
    assignee: 'users',
    sender: 'users',
    project: 'projects',
    tasks: 'tasks',
    owner: 'users',
    members: 'users'
  };
  return mapping[field] || field + 's';
}

// Wrap object to match Mongoose doc methods
function wrapDoc(collectionName, data) {
  if (!data) return null;
  
  // Clone data to avoid accidental mutations
  const doc = deepCopy(data);

  // Expose id as string along with _id
  if (doc._id) {
    doc.id = doc._id.toString();
  }

  // Add save method
  Object.defineProperty(doc, 'save', {
    enumerable: false,
    value: async function() {
      const db = loadDb();
      const items = db[collectionName] || [];
      const idx = items.findIndex(d => d._id === this._id);

      // Extract raw data fields (remove functions/helpers)
      const rawData = {};
      for (const key in this) {
        if (key !== 'id' && typeof this[key] !== 'function') {
          // If a populated object remains, unpack it back to an _id string to keep storage clean
          if (this[key] && typeof this[key] === 'object' && this[key]._id) {
            rawData[key] = this[key]._id;
          } else if (Array.isArray(this[key])) {
            rawData[key] = this[key].map(item => {
              if (item && typeof item === 'object' && item._id) {
                return item._id;
              }
              return item;
            });
          } else {
            rawData[key] = this[key];
          }
        }
      }

      rawData.updatedAt = new Date().toISOString();

      if (idx !== -1) {
        items[idx] = { ...items[idx], ...rawData };
      } else {
        rawData.createdAt = new Date().toISOString();
        items.push(rawData);
      }

      db[collectionName] = items;
      saveDb(db);
      
      // Update local doc properties
      this.updatedAt = rawData.updatedAt;
      if (rawData.createdAt) this.createdAt = rawData.createdAt;

      return this;
    }
  });

  return doc;
}

class MockCollection {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  find(query = {}) {
    return new MockQuery(this.collectionName, query);
  }

  findOne(query = {}) {
    const queryObj = new MockQuery(this.collectionName, query);
    queryObj._returnSingle = true;
    return queryObj;
  }

  async findById(id) {
    if (!id) return null;
    const idStr = id.toString();
    return this.findOne({ _id: idStr });
  }

  async create(data) {
    const docData = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    const wrapped = wrapDoc(this.collectionName, docData);
    await wrapped.save();
    return wrapped;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const doc = await this.findById(id);
    if (!doc) return null;

    // Apply updates
    const fields = update.$set || update;
    for (const key in fields) {
      doc[key] = fields[key];
    }

    await doc.save();
    return doc;
  }

  async findByIdAndDelete(id) {
    const idStr = id ? id.toString() : '';
    const db = loadDb();
    const items = db[this.collectionName] || [];
    const idx = items.findIndex(d => d._id === idStr);

    if (idx !== -1) {
      const removed = items.splice(idx, 1)[0];
      db[this.collectionName] = items;
      saveDb(db);
      return wrapDoc(this.collectionName, removed);
    }
    return null;
  }

  async deleteMany(query = {}) {
    const db = loadDb();
    const items = db[this.collectionName] || [];
    const beforeLen = items.length;
    const remaining = items.filter(item => !matchesQuery(item, query));
    db[this.collectionName] = remaining;
    saveDb(db);
    return { deletedCount: beforeLen - remaining.length };
  }

  async countDocuments(query = {}) {
    const db = loadDb();
    const items = db[this.collectionName] || [];
    return items.filter(item => matchesQuery(item, query)).length;
  }

  async updateMany(query = {}, update = {}) {
    const db = loadDb();
    const items = db[this.collectionName] || [];
    const fields = update.$set || update;
    let modifiedCount = 0;

    const updatedItems = items.map(item => {
      if (matchesQuery(item, query)) {
        modifiedCount++;
        return {
          ...item,
          ...fields,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    db[this.collectionName] = updatedItems;
    saveDb(db);
    return { modifiedCount };
  }
}

module.exports = {
  collection: (name) => new MockCollection(name),
  loadDb,
  saveDb,
  resetDb: () => saveDb(initialDb)
};
