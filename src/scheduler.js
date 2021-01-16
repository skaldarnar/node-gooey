//@ts-check

function chunkArray(array, size) {
  let result = []
  let arrayCopy = [...array]
  while (arrayCopy.length > 0) {
    result.push(arrayCopy.splice(0, size))
  }
  return result
}


async function processInChunks(tasks, chunkSize=20) {
  const chunks = chunkArray(tasks, chunkSize);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(task => task())
    )
  }
}

module.exports = {
  processInChunks
};