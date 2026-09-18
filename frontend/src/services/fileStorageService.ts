const DB_NAME =
  'ai-assurance-platform'

const DB_VERSION = 1

const STORE_NAME =
  'uploaded-assets'

interface StoredFile {
  assetId: string
  assessmentId: string
  fileName: string
  fileType: string
  size: number
  uploadedAt: string
  file: Blob
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(
          new Error(
            'IndexedDB is not supported by this browser.',
          ),
        )

        return
      }

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION,
        )

      request.onupgradeneeded =
        () => {
          const db =
            request.result

          if (
            !db.objectStoreNames.contains(
              STORE_NAME,
            )
          ) {
            db.createObjectStore(
              STORE_NAME,
              {
                keyPath:
                  'assetId',
              },
            )
          }
        }

      request.onsuccess =
        () => {
          resolve(
            request.result,
          )
        }

      request.onerror =
        () => {
          reject(
            request.error ??
              new Error(
                'Unable to open IndexedDB.',
              ),
          )
        }
    },
  )
}

export async function saveUploadedFile(
  assetId: string,
  assessmentId: string,
  file: File,
): Promise<void> {
  const db =
    await openDatabase()

  const record: StoredFile = {
    assetId,
    assessmentId,
    fileName: file.name,
    fileType: file.type,
    size: file.size,
    uploadedAt:
      new Date().toISOString(),
    file,
  }

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          'readwrite',
        )

      transaction
        .objectStore(
          STORE_NAME,
        )
        .put(record)

      transaction.oncomplete =
        () => resolve()

      transaction.onerror =
        () =>
          reject(
            transaction.error ??
              new Error(
                'Unable to save uploaded file.',
              ),
          )

      transaction.onabort =
        () =>
          reject(
            transaction.error ??
              new Error(
                'File storage transaction aborted.',
              ),
          )
    },
  )

  db.close()
}

export async function getUploadedFile(
  assetId: string,
): Promise<Blob | undefined> {
  const db =
    await openDatabase()

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          'readonly',
        )

      const request =
        transaction
          .objectStore(
            STORE_NAME,
          )
          .get(assetId)

      request.onsuccess =
        () => {
          const record =
            request.result as
              | StoredFile
              | undefined

          db.close()

          resolve(
            record?.file,
          )
        }

      request.onerror =
        () => {
          db.close()

          reject(
            request.error ??
              new Error(
                'Unable to retrieve uploaded file.',
              ),
          )
        }
    },
  )
}

export async function deleteUploadedFile(
  assetId: string,
): Promise<void> {
  const db =
    await openDatabase()

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          'readwrite',
        )

      transaction
        .objectStore(
          STORE_NAME,
        )
        .delete(assetId)

      transaction.oncomplete =
        () => resolve()

      transaction.onerror =
        () =>
          reject(
            transaction.error ??
              new Error(
                'Unable to delete uploaded file.',
              ),
          )
    },
  )

  db.close()
}
