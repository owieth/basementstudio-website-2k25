import { client } from "@/service/basehub"

const fetchProjectsLength = async () => {
  const res = await client().query({
    pages: {
      showcase: {
        projectList: { _meta: { totalCount: true } }
      }
    }
  })

  return res.pages.showcase.projectList._meta.totalCount
}

export async function Hero() {
  const length = await fetchProjectsLength()

  return (
    <section className="grid-layout !text-[3.5rem] text-f-h0-mobile">
      <h1 className="col-span-3 text-brand-w2 lg:col-start-1 lg:col-end-7 lg:text-f-h0">
        Showcase
      </h1>
      <div className="col-span-1 text-end text-brand-g1 lg:col-start-7 lg:col-end-12 lg:text-start lg:text-f-h0">
        {length}
      </div>
    </section>
  )
}
