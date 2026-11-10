/**
 * 결제 내역 캡처를 올리기 전에 줄인다.
 *
 * 휴대폰 캡처는 몇 MB 씩 된다. 그대로 보내면 올리는 데 오래 걸리고, 서버 한도(5MB)에 걸려 아예 거절되기도 한다.
 * 글자를 읽는 데는 폭 1080px 이면 충분해서 그 폭으로 줄이고 JPEG 로 바꾼다. 세로로 긴 화면은 글자가 뭉개지지 않게
 * 폭을 기준으로 줄인다. 줄이다가 문제가 생기면 원래 파일을 그대로 보낸다. 줄이기는 도움이지 조건이 아니다.
 */
const MAX_WIDTH = 1080
const MAX_HEIGHT = 6000
const SKIP_BELOW_BYTES = 400_000

export async function shrinkCapture(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height)
    if (scale === 1 && file.size < SKIP_BELOW_BYTES) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }
    // 투명한 부분은 JPEG 에서 검게 나온다. 흰 바탕을 먼저 깐다.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'capture'}.jpg`, { type: 'image/jpeg' })
  } catch {
    // 브라우저가 못 여는 형식(HEIC 등)이거나 메모리가 모자란 경우. 서버가 원본으로 판단하게 둔다.
    return file
  }
}
