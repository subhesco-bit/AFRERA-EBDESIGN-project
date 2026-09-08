#!/usr/bin/env python3
"""
EBDESIGN Comprehensive Infrastructure Audit
Analyzes every component, folder, subfolder, and generates production report
"""

import os
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class InfrastructureAudit:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.findings = {
            'backend': [],
            'frontend': [],
            'database': [],
            'infrastructure': [],
            'documentation': [],
            'ai_framework': [],
            'tests': [],
            'deployments': []
        }
        self.metrics = {}

    def audit_backend(self):
        """Audit backend infrastructure"""
        backend_path = self.project_root / 'backend' / 'src'

        # Count files by type
        js_files = list(backend_path.glob('**/*.js'))
        test_files = list(backend_path.glob('**/*.test.js'))
        service_files = list(backend_path.glob('services/**/*.js'))
        route_files = list(backend_path.glob('routes/**/*.js'))

        self.metrics['backend_js_files'] = len(js_files)
        self.metrics['backend_test_files'] = len(test_files)
        self.metrics['backend_services'] = len(service_files)
        self.metrics['backend_routes'] = len(route_files)

        # Audit structure
        required_dirs = ['services', 'routes', 'middleware', 'controllers', 'database']
        missing_dirs = []
        for req_dir in required_dirs:
            if not (backend_path / req_dir).exists():
                missing_dirs.append(req_dir)

        if missing_dirs:
            self.findings['backend'].append({
                'type': 'CRITICAL',
                'issue': f'Missing required directories: {", ".join(missing_dirs)}',
                'path': str(backend_path),
                'fix': f'Create directories: {", ".join(missing_dirs)}'
            })

        # Check main entry point
        index_js = backend_path.parent / 'src' / 'index.js'
        if not index_js.exists():
            self.findings['backend'].append({
                'type': 'CRITICAL',
                'issue': 'Missing backend entry point (index.js)',
                'path': str(backend_path),
                'fix': 'Create src/index.js with Express server setup'
            })

        # Check package.json
        pkg_json = backend_path.parent / 'package.json'
        if pkg_json.exists():
            with open(pkg_json) as f:
                pkg = json.load(f)
                if 'dependencies' not in pkg:
                    self.findings['backend'].append({
                        'type': 'WARNING',
                        'issue': 'No dependencies defined',
                        'path': str(pkg_json),
                        'fix': 'Run npm install and commit package-lock.json'
                    })

        return {
            'total_js_files': len(js_files),
            'test_files': len(test_files),
            'services': len(service_files),
            'routes': len(route_files),
            'missing_dirs': missing_dirs
        }

    def audit_frontend(self):
        """Audit frontend infrastructure"""
        frontend_path = self.project_root / 'frontend' / 'src'

        # Count files by type
        jsx_files = list(frontend_path.glob('**/*.jsx'))
        tsx_files = list(frontend_path.glob('**/*.tsx'))
        component_files = list(frontend_path.glob('components/**/*.jsx'))
        page_files = list(frontend_path.glob('pages/**/*.jsx'))
        test_files = list(frontend_path.glob('**/*.test.jsx'))

        self.metrics['frontend_jsx_files'] = len(jsx_files)
        self.metrics['frontend_components'] = len(component_files)
        self.metrics['frontend_pages'] = len(page_files)
        self.metrics['frontend_test_files'] = len(test_files)

        # Audit structure
        required_dirs = ['components', 'pages', 'hooks', 'store', 'services']
        missing_dirs = []
        for req_dir in required_dirs:
            if not (frontend_path / req_dir).exists():
                missing_dirs.append(req_dir)

        if missing_dirs:
            self.findings['frontend'].append({
                'type': 'CRITICAL',
                'issue': f'Missing required directories: {", ".join(missing_dirs)}',
                'path': str(frontend_path),
                'fix': f'Create directories: {", ".join(missing_dirs)}'
            })

        # Check main entry point
        main_jsx = frontend_path.parent / 'src' / 'main.jsx'
        if not main_jsx.exists():
            self.findings['frontend'].append({
                'type': 'CRITICAL',
                'issue': 'Missing frontend entry point (main.jsx)',
                'path': str(frontend_path),
                'fix': 'Create src/main.jsx with React/Vite setup'
            })

        # Check App.jsx
        app_jsx = frontend_path / 'App.jsx'
        if not app_jsx.exists():
            self.findings['frontend'].append({
                'type': 'WARNING',
                'issue': 'Missing App.jsx root component',
                'path': str(frontend_path),
                'fix': 'Create App.jsx with routing setup'
            })

        return {
            'total_jsx_files': len(jsx_files),
            'components': len(component_files),
            'pages': len(page_files),
            'test_files': len(test_files),
            'missing_dirs': missing_dirs
        }

    def audit_database(self):
        """Audit database setup"""
        db_path = self.project_root / 'backend' / 'src' / 'database'

        # Check migrations
        migrations_path = db_path / 'migrations'
        migrations = []
        if migrations_path.exists():
            migrations = list(migrations_path.glob('*.sql'))

        self.metrics['database_migrations'] = len(migrations)

        # Check migration runner
        migrate_js = db_path / 'migrate.js'
        if not migrate_js.exists():
            self.findings['database'].append({
                'type': 'CRITICAL',
                'issue': 'Missing migration runner (migrate.js)',
                'path': str(db_path),
                'fix': 'Create migrate.js to execute SQL migrations'
            })

        # Check database schema
        schema_file = db_path / 'schema.sql'
        if not schema_file.exists():
            self.findings['database'].append({
                'type': 'WARNING',
                'issue': 'No schema.sql file found',
                'path': str(db_path),
                'fix': 'Create schema.sql with database structure'
            })

        if len(migrations) == 0:
            self.findings['database'].append({
                'type': 'CRITICAL',
                'issue': 'No SQL migration files found',
                'path': str(migrations_path),
                'fix': 'Create migration SQL files in migrations/ directory'
            })

        return {
            'migrations': len(migrations),
            'migration_runner': migrate_js.exists(),
            'schema_file': schema_file.exists()
        }

    def audit_infrastructure(self):
        """Audit infrastructure (Docker, config, etc)"""
        # Check Dockerfile
        dockerfile = self.project_root / 'backend' / 'Dockerfile'
        if not dockerfile.exists():
            self.findings['infrastructure'].append({
                'type': 'WARNING',
                'issue': 'Missing backend Dockerfile',
                'path': str(self.project_root / 'backend'),
                'fix': 'Create Dockerfile for containerization'
            })

        # Check docker-compose
        docker_compose = self.project_root / 'docker-compose.yml'
        docker_compose_dev = self.project_root / 'docker-compose.dev.yml'
        if not docker_compose.exists() and not docker_compose_dev.exists():
            self.findings['infrastructure'].append({
                'type': 'WARNING',
                'issue': 'Missing docker-compose file',
                'path': str(self.project_root),
                'fix': 'Create docker-compose.yml or docker-compose.dev.yml'
            })

        # Check .env files
        backend_env = self.project_root / 'backend' / '.env'
        if not backend_env.exists():
            self.findings['infrastructure'].append({
                'type': 'WARNING',
                'issue': 'Missing .env file in backend',
                'path': str(self.project_root / 'backend'),
                'fix': 'Create .env with database credentials (do not commit)'
            })

        # Check .env.example
        env_example = self.project_root / 'backend' / '.env.example'
        if env_example.exists():
            self.findings['infrastructure'].append({
                'type': 'INFO',
                'issue': '.env.example found (good practice)',
                'path': str(env_example),
                'fix': 'Keep .env.example in git, .env in .gitignore'
            })

        return {
            'dockerfile': dockerfile.exists(),
            'docker_compose': docker_compose.exists() or docker_compose_dev.exists(),
            'env_file': backend_env.exists(),
            'env_example': env_example.exists()
        }

    def audit_documentation(self):
        """Audit documentation"""
        docs_path = self.project_root / 'docs'
        ai_path = self.project_root / '.ai'

        # Check main README
        readme = self.project_root / 'README.md'
        if not readme.exists():
            self.findings['documentation'].append({
                'type': 'WARNING',
                'issue': 'Missing main README.md',
                'path': str(self.project_root),
                'fix': 'Create README.md with project overview'
            })

        # Check docs directory
        if not docs_path.exists():
            self.findings['documentation'].append({
                'type': 'INFO',
                'issue': 'No docs/ directory found',
                'path': str(self.project_root),
                'fix': 'Create docs/ directory for API docs, architecture, etc'
            })

        # Check .ai directory
        if ai_path.exists():
            ai_files = list(ai_path.glob('*.md'))
            self.metrics['ai_docs'] = len(ai_files)
            if len(ai_files) > 0:
                self.findings['documentation'].append({
                    'type': 'INFO',
                    'issue': f'.ai/ directory exists with {len(ai_files)} documentation files',
                    'path': str(ai_path),
                    'fix': 'Continue expanding AI collaboration documentation'
                })

        return {
            'readme': readme.exists(),
            'docs_dir': docs_path.exists(),
            'ai_docs': self.metrics.get('ai_docs', 0)
        }

    def audit_ai_framework(self):
        """Audit AI framework setup"""
        ai_path = self.project_root / '.ai'
        core_path = self.project_root / 'backend' / 'src' / 'core'

        # Check core AI files
        ai_coordinator = core_path / 'claudeAICoordinator.js'
        if not ai_coordinator.exists():
            self.findings['ai_framework'].append({
                'type': 'INFO',
                'issue': 'Claude AI Coordinator not yet implemented',
                'path': str(core_path),
                'fix': 'Implement claudeAICoordinator.js for AI integration'
            })

        # Check AI services
        library_service = self.project_root / 'backend' / 'src' / 'services' / 'libraryKnowledgeService.js'
        if not library_service.exists():
            self.findings['ai_framework'].append({
                'type': 'INFO',
                'issue': 'Library Knowledge Service not yet implemented',
                'path': str(self.project_root / 'backend' / 'src' / 'services'),
                'fix': 'Implement libraryKnowledgeService.js for library integration'
            })

        # Check AI documentation in .ai/
        if ai_path.exists():
            ai_files = list(ai_path.glob('**/*.md'))
            self.metrics['ai_framework_docs'] = len(ai_files)

        return {
            'coordinator': ai_coordinator.exists(),
            'library_service': library_service.exists(),
            'ai_docs': self.metrics.get('ai_framework_docs', 0)
        }

    def audit_tests(self):
        """Audit testing setup"""
        backend_test_dir = self.project_root / 'backend' / 'src' / '__tests__'
        frontend_test_dir = self.project_root / 'frontend' / 'src' / '__tests__'

        # Count test files
        backend_tests = []
        frontend_tests = []

        if backend_test_dir.exists():
            backend_tests = list(backend_test_dir.glob('**/*.test.js'))

        if frontend_test_dir.exists():
            frontend_tests = list(frontend_test_dir.glob('**/*.test.jsx'))

        self.metrics['backend_tests'] = len(backend_tests)
        self.metrics['frontend_tests'] = len(frontend_tests)

        # Check test configuration
        backend_jest = self.project_root / 'backend' / 'jest.config.js'
        if not backend_jest.exists():
            self.findings['tests'].append({
                'type': 'INFO',
                'issue': 'No Jest configuration for backend',
                'path': str(self.project_root / 'backend'),
                'fix': 'Create jest.config.js for test setup'
            })

        frontend_jest = self.project_root / 'frontend' / 'jest.config.js'
        if not frontend_jest.exists():
            self.findings['tests'].append({
                'type': 'INFO',
                'issue': 'No Jest configuration for frontend',
                'path': str(self.project_root / 'frontend'),
                'fix': 'Create jest.config.js for test setup'
            })

        return {
            'backend_tests': len(backend_tests),
            'frontend_tests': len(frontend_tests),
            'jest_configured': backend_jest.exists() and frontend_jest.exists()
        }

    def audit_deployments(self):
        """Audit deployment configuration"""
        # Check GitHub Actions
        github_actions = self.project_root / '.github' / 'workflows'
        workflows = []
        if github_actions.exists():
            workflows = list(github_actions.glob('*.yml')) + list(github_actions.glob('*.yaml'))

        self.metrics['github_workflows'] = len(workflows)

        # Check k8s or deployment files
        k8s_path = self.project_root / 'k8s'
        deploy_path = self.project_root / 'deploy'

        has_k8s = k8s_path.exists()
        has_deploy = deploy_path.exists()

        if len(workflows) == 0:
            self.findings['deployments'].append({
                'type': 'INFO',
                'issue': 'No GitHub Actions workflows configured',
                'path': str(self.project_root / '.github'),
                'fix': 'Create .github/workflows/ for CI/CD'
            })

        if not has_k8s and not has_deploy:
            self.findings['deployments'].append({
                'type': 'INFO',
                'issue': 'No Kubernetes or deployment configuration found',
                'path': str(self.project_root),
                'fix': 'Create k8s/ or deploy/ directory for deployment specs'
            })

        return {
            'workflows': len(workflows),
            'kubernetes': has_k8s,
            'deploy_config': has_deploy
        }

    def generate_audit_report(self):
        """Generate comprehensive audit report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'project': str(self.project_root),
            'audit_results': {
                'backend': self.audit_backend(),
                'frontend': self.audit_frontend(),
                'database': self.audit_database(),
                'infrastructure': self.audit_infrastructure(),
                'documentation': self.audit_documentation(),
                'ai_framework': self.audit_ai_framework(),
                'tests': self.audit_tests(),
                'deployments': self.audit_deployments()
            },
            'findings': self.findings,
            'metrics': self.metrics
        }

        return report


if __name__ == '__main__':
    project_root = r'C:\Users\DIYA GOEL\Downloads\EBDESIGN'
    audit = InfrastructureAudit(project_root)
    report = audit.generate_audit_report()

    # Print report as JSON
    print(json.dumps(report, indent=2))

    # Save report
    report_path = Path(project_root) / '.ai' / 'migration' / 'infrastructure-audit-report.json'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Audit complete. Report saved to {report_path}")
