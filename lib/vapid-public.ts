// Archivo seguro para el cliente — NO importa web-push
// Solo expone la clave pública VAPID para suscripciones push en el browser
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
