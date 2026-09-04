import os
import re

def update_app_tsx():
    with open("frontend/src/App.tsx", "r", encoding="utf-8") as f:
        content = f.read()

    # Add import
    import_addition = """import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { WithEmptyState } from './components/common/EmptyState';"""
    content = content.replace("import { AuthProvider } from './contexts/AuthContext';\nimport { ProtectedRoute } from './components/auth/ProtectedRoute';", import_addition)

    # Wrap routes with WithEmptyState
    # Instead of doing it for every route, we can do it in the JSX directly
    content = content.replace("<Route path=\"incidents\" element={<Incidents />} />", "<Route path=\"incidents\" element={<WithEmptyState><Incidents /></WithEmptyState>} />")
    content = content.replace("<Route path=\"incidents/:id\" element={<IncidentDetails />} />", "<Route path=\"incidents/:id\" element={<WithEmptyState><IncidentDetails /></WithEmptyState>} />")
    content = content.replace("<Route path=\"metrics\" element={<Metrics />} />", "<Route path=\"metrics\" element={<WithEmptyState><Metrics /></WithEmptyState>} />")
    content = content.replace("<Route path=\"analysis\" element={<AIAnalysis />} />", "<Route path=\"analysis\" element={<WithEmptyState><AIAnalysis /></WithEmptyState>} />")
    content = content.replace("<Route path=\"recommendations\" element={<Recommendations />} />", "<Route path=\"recommendations\" element={<WithEmptyState><Recommendations /></WithEmptyState>} />")
    
    with open("frontend/src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)

update_app_tsx()
