export const readAsDataUrl = (file: File) => {
  const result = new Promise<string>(resolve => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.readAsDataURL(file)
  })
  return result
}
