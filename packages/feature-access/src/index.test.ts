import { describe, expect, it } from 'vitest'
import { bootstrapCapabilities } from './index'
describe('bootstrap capabilities', () => { it('fails closed', () => { expect(Object.values(bootstrapCapabilities).every(v => v === false)).toBe(true) }) })
