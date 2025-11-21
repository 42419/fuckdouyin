import app from '../../src/index'
import { handle } from 'hono/netlify'

export default handle(app)
