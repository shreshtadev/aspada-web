// lib/server/pb.ts
import { createPB } from '../pb'

export function getAuthPB(request: Request) {
  return createPB(request.headers.get('cookie') ?? '')
}

export function getPublicPB() {
  return createPB()
}