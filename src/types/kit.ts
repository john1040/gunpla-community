export interface Kit {
  title: string
  releaseDate: string
  url: string
  exclusive: string
  price: string
  imgUrlList: string[]
  categories?: {
    brand?: string
    series?: string
  }
}