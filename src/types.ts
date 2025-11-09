export type Card = {
  id: number
  title: string
  memo: string
  color?: string
}

export type Column = {
  id: string
  title: string
  cards: Card[]
  color?: string
}

export type Tab = {
  id: number
  name: string
  color?: string
}
