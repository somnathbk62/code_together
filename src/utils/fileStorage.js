// File storage utility using IndexedDB
const DB_NAME = "CodeTogetherFiles";
const STORE_NAME = "files";
const DB_VERSION = 1;

// Initialize the database
const initDB = () => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      const error = new Error("Your browser doesn't support IndexedDB");
      console.error(error);
      reject(error);
      return;
    }

    // Open the database
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle errors
    request.onerror = (event) => {
      const error = event.target.error;
      console.error("IndexedDB error:", error);
      reject(
        `Could not open file storage database: ${
          error.message || "Unknown error"
        }`
      );
    };

    // Handle blocked (occurs when the database is still open in another tab)
    request.onblocked = (event) => {
      console.warn(
        "Database open is blocked. Please close other tabs with this app open."
      );
      reject(
        "Database open is blocked. Please close other tabs with this app open."
      );
    };

    // Handle success
    request.onsuccess = (event) => {
      const db = event.target.result;

      // Add error handler for the database
      db.onerror = (event) => {
        console.error("Database error:", event.target.error);
      };

      resolve(db);
    };

    // Handle database upgrade/creation
    request.onupgradeneeded = (event) => {
      console.log(
        `Upgrading database from version ${event.oldVersion} to ${event.newVersion}`
      );
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });

        // Create indexes for faster queries
        store.createIndex("by_name", "name", { unique: false });
        store.createIndex("by_type", "type", { unique: false });
        store.createIndex("by_timestamp", "timestamp", { unique: false });

        console.log(`Object store ${STORE_NAME} created successfully`);
      }
    };
  });
};

// Store a file in IndexedDB
export const storeFile = async (fileData) => {
  try {
    // First, read the file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(fileData.file);

    // Then, store the file data in IndexedDB
    const db = await initDB();
    return new Promise((resolve, reject) => {
      // Create transaction AFTER file is read
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Add transaction error handling
      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(`Transaction failed: ${event.target.error.message}`);
      };

      // Add transaction abort handling
      transaction.onabort = (event) => {
        console.error("Transaction aborted:", event.target.error);
        reject(
          `Transaction aborted: ${
            event.target.error?.message || "Unknown reason"
          }`
        );
      };

      // Prepare file data
      const fileToStore = {
        id: fileData.id,
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        data: arrayBuffer,
        isImage: fileData.isImage,
        timestamp: Date.now(),
      };

      // Store the file
      const request = store.put(fileToStore);

      request.onsuccess = () => {
        resolve(fileData.id);
      };

      request.onerror = (event) => {
        console.error("Error storing file:", event.target.error);
        reject(`Failed to store file: ${event.target.error.message}`);
      };
    });
  } catch (error) {
    console.error("Store file error:", error);
    throw new Error(
      `Failed to store file: ${error.message || "Unknown error"}`
    );
  }
};

// Helper function to read file as ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (event) => {
      console.error("FileReader error:", event.target.error);
      reject(
        `Failed to read file: ${event.target.error?.message || "Unknown error"}`
      );
    };

    // Add progress event for large files
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        console.log(`Reading file: ${progress}% complete`);
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

// Retrieve a file from IndexedDB
export const getFile = async (fileId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      // Add transaction error handling
      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(`Transaction failed: ${event.target.error.message}`);
      };

      // Add transaction abort handling
      transaction.onabort = (event) => {
        console.error("Transaction aborted:", event.target.error);
        reject(
          `Transaction aborted: ${
            event.target.error?.message || "Unknown reason"
          }`
        );
      };

      const request = store.get(fileId);

      request.onsuccess = (event) => {
        const file = event.target.result;
        if (file) {
          resolve(file);
        } else {
          reject(`File not found: ${fileId}`);
        }
      };

      request.onerror = (event) => {
        console.error("Error retrieving file:", event.target.error);
        reject(`Failed to retrieve file: ${event.target.error.message}`);
      };
    });
  } catch (error) {
    console.error("Get file error:", error);
    throw new Error(
      `Failed to retrieve file: ${error.message || "Unknown error"}`
    );
  }
};

// Create a download URL for a file
export const createDownloadUrl = async (fileId) => {
  try {
    // Get the file from IndexedDB
    const file = await getFile(fileId);

    // Create a blob from the file data
    const blob = new Blob([file.data], { type: file.type });

    // Create and return object with URL and metadata
    return {
      url: URL.createObjectURL(blob),
      name: file.name,
      type: file.type,
      size: file.size,
      isImage: file.isImage,
      id: file.id,
    };
  } catch (error) {
    console.error("Create download URL error:", error);
    throw new Error(
      `Failed to create download URL: ${error.message || "Unknown error"}`
    );
  }
};

// Download a file directly
export const downloadFile = async (fileId, fileName) => {
  try {
    // Get the file from IndexedDB
    const file = await getFile(fileId);

    // Create a blob from the file data
    const blob = new Blob([file.data], { type: file.type });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a download link
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || file.name;
    a.style.display = "none";
    document.body.appendChild(a);

    // Trigger the download
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200); // Increased timeout for better reliability

    return true;
  } catch (error) {
    console.error("Download file error:", error);
    throw new Error(
      `Failed to download file: ${error.message || "Unknown error"}`
    );
  }
};

// Retry mechanism for file operations
export const retryOperation = async (
  operation,
  maxRetries = 3,
  delay = 500
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(
        `Operation failed (attempt ${attempt}/${maxRetries}):`,
        error
      );
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

// Delete a file from IndexedDB
export const deleteFile = async (fileId) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Add transaction error handling
      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(`Transaction failed: ${event.target.error.message}`);
      };

      // Add transaction abort handling
      transaction.onabort = (event) => {
        console.error("Transaction aborted:", event.target.error);
        reject(
          `Transaction aborted: ${
            event.target.error?.message || "Unknown reason"
          }`
        );
      };

      const request = store.delete(fileId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error("Error deleting file:", event.target.error);
        reject(`Failed to delete file: ${event.target.error.message}`);
      };
    });
  } catch (error) {
    console.error("Delete file error:", error);
    throw new Error(
      `Failed to delete file: ${error.message || "Unknown error"}`
    );
  }
};

// List all files in the database
export const listFiles = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      // Add transaction error handling
      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(`Transaction failed: ${event.target.error.message}`);
      };

      // Add transaction abort handling
      transaction.onabort = (event) => {
        console.error("Transaction aborted:", event.target.error);
        reject(
          `Transaction aborted: ${
            event.target.error?.message || "Unknown reason"
          }`
        );
      };

      const request = store.getAll();

      request.onsuccess = (event) => {
        const files = event.target.result.map((file) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          isImage: file.isImage,
          timestamp: file.timestamp,
        }));
        resolve(files);
      };

      request.onerror = (event) => {
        console.error("Error listing files:", event.target.error);
        reject(`Failed to list files: ${event.target.error.message}`);
      };
    });
  } catch (error) {
    console.error("List files error:", error);
    throw new Error(
      `Failed to list files: ${error.message || "Unknown error"}`
    );
  }
};

// Clear all files from the database
export const clearFiles = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Add transaction error handling
      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
        reject(`Transaction failed: ${event.target.error.message}`);
      };

      // Add transaction abort handling
      transaction.onabort = (event) => {
        console.error("Transaction aborted:", event.target.error);
        reject(
          `Transaction aborted: ${
            event.target.error?.message || "Unknown reason"
          }`
        );
      };

      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error("Error clearing files:", event.target.error);
        reject(`Failed to clear files: ${event.target.error.message}`);
      };
    });
  } catch (error) {
    console.error("Clear files error:", error);
    throw new Error(
      `Failed to clear files: ${error.message || "Unknown error"}`
    );
  }
};
