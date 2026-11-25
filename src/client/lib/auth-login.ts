const PRODUCTION_LOGIN_URL = 'https://login.ebichu.cc/login'
const DEV_LOGIN_PORT = '4321'

export function goToLogin() {
  const url = import.meta.env.DEV
    ? new URL(`http://${window.location.hostname}:${DEV_LOGIN_PORT}/login`)
    : new URL(PRODUCTION_LOGIN_URL)
  url.searchParams.set('return_to', window.location.href)
  window.location.assign(url.toString())
}
