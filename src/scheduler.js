//@ts-check

function chunkArray(array, size) {
  let result = []
  let arrayCopy = [...array]
  while (arrayCopy.length > 0) {
    result.push(arrayCopy.splice(0, size))
  }
  return result
}

/**
 * @param {Array<() => Promise<any>>} tasks 
 * @param {Object} options 
 * @param {number} options.chunkSize
 */
async function processInChunks(tasks, options={chunkSize:20}) {
  const chunks = chunkArray(tasks, options.chunkSize);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(task => task())
    )
  }
}

module.exports = {
  processInChunks
};