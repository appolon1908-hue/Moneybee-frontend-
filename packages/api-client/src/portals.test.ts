import { describe, expect, it } from 'vitest'

import { withQuery } from './portals'

describe('portal API query serialization', () => {
  it('omits empty values and encodes the remaining query', () => {
    expect(
      withQuery('/admin/work-queue', {
        status: 'IN PROGRESS',
        priority: null,
        limit: 25,
        active: false,
      }),
    ).toBe('/admin/work-queue?status=IN+PROGRESS&limit=25&active=false')
  })

  it('returns the original path when no filters are supplied', () => {
    expect(withQuery('/portal/tasks', {})).toBe('/portal/tasks')
  })
})
