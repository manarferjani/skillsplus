import { AnyRoute, createRoute } from '@tanstack/react-router'
import { RootPage } from './RootPage.tsx' // à créer aussi

export const RootRoute = createRoute({
    id: 'root',
    path: '/',
    component: RootPage,
    getParentRoute: function (): AnyRoute {
        throw new Error('Function not implemented.')
    }
})
