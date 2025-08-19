#!/usr/bin/env node

/**
 * CREATE COMPREHENSIVE DEFAULT TEMPLATES
 * Phase 4: Creates enhanced default templates for various business scenarios
 * Date: 2025-08-19
 * Execution: Step-by-step with militant precision
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// ANSI color codes for professional output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
}

// Initialize Supabase service client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

let createdData = {
  templates: [],
  milestones: [],
  tasks: []
}

/**
 * Get admin user for template creation
 */
async function getAdminUser() {
  log.info('Retrieving admin user for template ownership...')
  
  const { data, error } = await serviceClient
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'admin')
    .limit(1)
    .single()
  
  if (error) {
    log.error('Failed to retrieve admin user')
    throw error
  }
  
  log.success(`Admin user found: ${data.email}`)
  return data
}

/**
 * TEMPLATE 1: ENTERPRISE WEBSITE DEVELOPMENT
 * Comprehensive web development project template
 */
async function createEnterpriseWebsiteTemplate(adminUserId) {
  log.header('CREATING ENTERPRISE WEBSITE TEMPLATE')
  
  const templateData = {
    name: 'Enterprise Website Development',
    description: 'Comprehensive website development project for enterprise clients with full discovery, design, development, and launch phases.',
    color: 'blue',
    created_by: adminUserId,
    is_default: true
  }
  
  const milestones = [
    {
      name: 'Project Discovery & Planning',
      description: 'Initial client consultation, requirements gathering, and project planning phase.',
      position: 0,
      relative_start_days: '0',
      relative_due_days: '10',
      tasks: [
        {
          title: 'Client stakeholder interviews',
          description: 'Conduct detailed interviews with key stakeholders to understand business objectives.',
          position: 0,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '2'
        },
        {
          title: 'Technical requirements analysis',
          description: 'Analyze technical requirements and third-party integrations needed.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 12,
          relative_due_days: '4'
        },
        {
          title: 'Content audit and strategy',
          description: 'Review existing content and develop content strategy for new site.',
          position: 2,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 6,
          relative_due_days: '6'
        },
        {
          title: 'Project timeline and milestones',
          description: 'Create detailed project timeline with client approval checkpoints.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 4,
          relative_due_days: '8'
        },
        {
          title: 'Hosting and infrastructure planning',
          description: 'Plan hosting requirements, CDN setup, and infrastructure needs.',
          position: 4,
          priority: 'medium',
          visibility: 'internal',
          estimated_hours: 6,
          relative_due_days: '10'
        }
      ]
    },
    {
      name: 'UX/UI Design & Prototyping',
      description: 'User experience research, wireframing, visual design, and interactive prototypes.',
      position: 1,
      relative_start_days: '10',
      relative_due_days: '35',
      tasks: [
        {
          title: 'User research and personas',
          description: 'Conduct user research and develop user personas for target audiences.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 16,
          relative_due_days: '5'
        },
        {
          title: 'Information architecture',
          description: 'Design site structure, navigation hierarchy, and user flows.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '8'
        },
        {
          title: 'Wireframe creation',
          description: 'Create detailed wireframes for all key pages and user interactions.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 20,
          relative_due_days: '15'
        },
        {
          title: 'Visual design system',
          description: 'Develop brand-aligned visual design system including colors, typography, and components.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 24,
          relative_due_days: '20'
        },
        {
          title: 'High-fidelity mockups',
          description: 'Create pixel-perfect mockups for desktop, tablet, and mobile views.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 32,
          relative_due_days: '25'
        }
      ]
    },
    {
      name: 'Development & Integration',
      description: 'Frontend and backend development, CMS integration, and third-party service connections.',
      position: 2,
      relative_start_days: '35',
      relative_due_days: '70',
      tasks: [
        {
          title: 'Development environment setup',
          description: 'Set up development, staging, and production environments with proper workflows.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 8,
          relative_due_days: '2'
        },
        {
          title: 'Frontend development (Phase 1)',
          description: 'Develop HTML/CSS/JS for homepage, about, and key landing pages.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 40,
          relative_due_days: '12'
        },
        {
          title: 'CMS integration and configuration',
          description: 'Integrate and configure content management system with custom fields.',
          position: 2,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 24,
          relative_due_days: '18'
        },
        {
          title: 'Frontend development (Phase 2)',
          description: 'Complete remaining pages, forms, and interactive components.',
          position: 3,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 48,
          relative_due_days: '25'
        },
        {
          title: 'Third-party integrations',
          description: 'Integrate analytics, CRM, email marketing, and other required services.',
          position: 4,
          priority: 'medium',
          visibility: 'internal',
          estimated_hours: 20,
          relative_due_days: '30'
        },
        {
          title: 'SEO optimization',
          description: 'Implement on-page SEO, meta tags, structured data, and performance optimization.',
          position: 5,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 16,
          relative_due_days: '35'
        }
      ]
    },
    {
      name: 'Testing, Launch & Handover',
      description: 'Quality assurance, user acceptance testing, launch preparation, and client training.',
      position: 3,
      relative_start_days: '70',
      relative_due_days: '84',
      tasks: [
        {
          title: 'Cross-browser and device testing',
          description: 'Comprehensive testing across browsers, devices, and screen resolutions.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 16,
          relative_due_days: '3'
        },
        {
          title: 'User acceptance testing',
          description: 'Client review and testing of all functionality with feedback incorporation.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '6'
        },
        {
          title: 'Performance optimization',
          description: 'Final performance tuning, image optimization, and speed improvements.',
          position: 2,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 12,
          relative_due_days: '9'
        },
        {
          title: 'Content migration and training',
          description: 'Migrate existing content and train client team on CMS usage.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '11'
        },
        {
          title: 'Go-live and monitoring',
          description: 'Deploy to production, configure monitoring, and provide post-launch support.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 6,
          relative_due_days: '14'
        }
      ]
    }
  ]
  
  return await createTemplate(templateData, milestones)
}

/**
 * TEMPLATE 2: DIGITAL MARKETING CAMPAIGN
 * Comprehensive marketing campaign from strategy to analysis
 */
async function createMarketingCampaignTemplate(adminUserId) {
  log.header('CREATING DIGITAL MARKETING CAMPAIGN TEMPLATE')
  
  const templateData = {
    name: 'Digital Marketing Campaign',
    description: 'Complete digital marketing campaign template including strategy development, content creation, execution, and performance analysis.',
    color: 'green',
    created_by: adminUserId,
    is_default: true
  }
  
  const milestones = [
    {
      name: 'Campaign Strategy & Research',
      description: 'Market research, competitor analysis, and strategic campaign planning.',
      position: 0,
      relative_start_days: '0',
      relative_due_days: '7',
      tasks: [
        {
          title: 'Market research and analysis',
          description: 'Conduct thorough market research and competitive landscape analysis.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 10,
          relative_due_days: '2'
        },
        {
          title: 'Target audience definition',
          description: 'Define and segment target audiences with detailed personas.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '3'
        },
        {
          title: 'Campaign objectives and KPIs',
          description: 'Set clear campaign objectives and define measurable KPIs.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 4,
          relative_due_days: '4'
        },
        {
          title: 'Channel strategy and budget allocation',
          description: 'Determine optimal marketing channels and allocate budget across platforms.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 6,
          relative_due_days: '6'
        },
        {
          title: 'Campaign timeline and milestones',
          description: 'Create detailed campaign timeline with key milestones and dependencies.',
          position: 4,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 4,
          relative_due_days: '7'
        }
      ]
    },
    {
      name: 'Content Creation & Asset Development',
      description: 'Creative brief development, content creation, and marketing asset production.',
      position: 1,
      relative_start_days: '7',
      relative_due_days: '21',
      tasks: [
        {
          title: 'Creative brief and messaging framework',
          description: 'Develop comprehensive creative brief and key messaging framework.',
          position: 0,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '3'
        },
        {
          title: 'Visual asset creation',
          description: 'Design graphics, banners, social media assets, and display advertisements.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 24,
          relative_due_days: '8'
        },
        {
          title: 'Copy and content writing',
          description: 'Write compelling ad copy, social media content, and email campaigns.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '10'
        },
        {
          title: 'Video and multimedia content',
          description: 'Produce video content, animations, and other multimedia assets.',
          position: 3,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 20,
          relative_due_days: '12'
        },
        {
          title: 'Content approval and revisions',
          description: 'Client review process and implementation of approved revisions.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '14'
        }
      ]
    },
    {
      name: 'Campaign Launch & Execution',
      description: 'Platform setup, campaign launch, and real-time optimization.',
      position: 2,
      relative_start_days: '21',
      relative_due_days: '35',
      tasks: [
        {
          title: 'Platform setup and configuration',
          description: 'Set up advertising accounts, tracking, and campaign configurations.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 12,
          relative_due_days: '2'
        },
        {
          title: 'Soft launch and testing',
          description: 'Launch campaigns in test mode to verify tracking and functionality.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 6,
          relative_due_days: '4'
        },
        {
          title: 'Full campaign launch',
          description: 'Launch all campaign elements across selected channels and platforms.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 4,
          relative_due_days: '5'
        },
        {
          title: 'Daily monitoring and optimization',
          description: 'Monitor campaign performance and make real-time optimizations.',
          position: 3,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 20,
          relative_due_days: '12'
        },
        {
          title: 'Weekly performance reports',
          description: 'Create and deliver weekly performance reports with insights.',
          position: 4,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '14'
        }
      ]
    },
    {
      name: 'Analysis & Optimization',
      description: 'Campaign performance analysis, optimization recommendations, and final reporting.',
      position: 3,
      relative_start_days: '35',
      relative_due_days: '42',
      tasks: [
        {
          title: 'Performance data collection',
          description: 'Gather comprehensive performance data from all campaign channels.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 6,
          relative_due_days: '2'
        },
        {
          title: 'ROI and conversion analysis',
          description: 'Analyze return on investment and conversion performance across channels.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 8,
          relative_due_days: '4'
        },
        {
          title: 'Audience insights and learnings',
          description: 'Extract audience insights and key learnings for future campaigns.',
          position: 2,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 6,
          relative_due_days: '5'
        },
        {
          title: 'Optimization recommendations',
          description: 'Develop actionable recommendations for future campaign improvements.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '6'
        },
        {
          title: 'Final campaign report',
          description: 'Create comprehensive final report with results and recommendations.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 10,
          relative_due_days: '7'
        }
      ]
    }
  ]
  
  return await createTemplate(templateData, milestones)
}

/**
 * TEMPLATE 3: MOBILE APP DEVELOPMENT
 * Full-stack mobile application development template
 */
async function createMobileAppTemplate(adminUserId) {
  log.header('CREATING MOBILE APP DEVELOPMENT TEMPLATE')
  
  const templateData = {
    name: 'Mobile App Development',
    description: 'Complete mobile application development template covering planning, design, development, testing, and app store deployment.',
    color: 'purple',
    created_by: adminUserId,
    is_default: true
  }
  
  const milestones = [
    {
      name: 'App Planning & Architecture',
      description: 'Requirements analysis, technical planning, and application architecture design.',
      position: 0,
      relative_start_days: '0',
      relative_due_days: '14',
      tasks: [
        {
          title: 'Requirements gathering and analysis',
          description: 'Detailed analysis of functional and non-functional requirements.',
          position: 0,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '3'
        },
        {
          title: 'Platform and technology selection',
          description: 'Choose development platform (native, hybrid, etc.) and technology stack.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 8,
          relative_due_days: '5'
        },
        {
          title: 'Application architecture design',
          description: 'Design overall app architecture, data models, and API structure.',
          position: 2,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 20,
          relative_due_days: '8'
        },
        {
          title: 'Feature specification documentation',
          description: 'Create detailed feature specifications and user story documentation.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '10'
        },
        {
          title: 'Development timeline and resource planning',
          description: 'Plan development phases, resource allocation, and delivery timeline.',
          position: 4,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 6,
          relative_due_days: '14'
        }
      ]
    },
    {
      name: 'UI/UX Design & Prototyping',
      description: 'User experience design, interface mockups, and interactive prototypes.',
      position: 1,
      relative_start_days: '14',
      relative_due_days: '35',
      tasks: [
        {
          title: 'User journey mapping',
          description: 'Map complete user journeys and define optimal user flows.',
          position: 0,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '4'
        },
        {
          title: 'Wireframing and information architecture',
          description: 'Create detailed wireframes and define app information architecture.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 20,
          relative_due_days: '8'
        },
        {
          title: 'Visual design and UI components',
          description: 'Design visual interface elements and create reusable UI component library.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 32,
          relative_due_days: '15'
        },
        {
          title: 'Interactive prototyping',
          description: 'Build clickable prototypes for user testing and client approval.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '18'
        },
        {
          title: 'Design system documentation',
          description: 'Document complete design system and handoff materials for development.',
          position: 4,
          priority: 'medium',
          visibility: 'internal',
          estimated_hours: 8,
          relative_due_days: '21'
        }
      ]
    },
    {
      name: 'Development & Integration',
      description: 'Core app development, backend integration, and feature implementation.',
      position: 2,
      relative_start_days: '35',
      relative_due_days: '84',
      tasks: [
        {
          title: 'Development environment setup',
          description: 'Set up development tools, CI/CD pipeline, and testing frameworks.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 12,
          relative_due_days: '3'
        },
        {
          title: 'Core app foundation development',
          description: 'Build app foundation, navigation, and core architectural components.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 40,
          relative_due_days: '12'
        },
        {
          title: 'Backend API development',
          description: 'Develop backend APIs, database design, and server infrastructure.',
          position: 2,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 48,
          relative_due_days: '20'
        },
        {
          title: 'Feature implementation (Phase 1)',
          description: 'Implement primary app features and core functionality.',
          position: 3,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 60,
          relative_due_days: '30'
        },
        {
          title: 'Feature implementation (Phase 2)',
          description: 'Complete remaining features and advanced functionality.',
          position: 4,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 48,
          relative_due_days: '40'
        },
        {
          title: 'Third-party integrations',
          description: 'Integrate payment systems, analytics, push notifications, and other services.',
          position: 5,
          priority: 'medium',
          visibility: 'internal',
          estimated_hours: 24,
          relative_due_days: '45'
        },
        {
          title: 'Performance optimization',
          description: 'Optimize app performance, memory usage, and battery efficiency.',
          position: 6,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 16,
          relative_due_days: '49'
        }
      ]
    },
    {
      name: 'Testing & App Store Deployment',
      description: 'Quality assurance, user testing, app store submission, and launch support.',
      position: 3,
      relative_start_days: '84',
      relative_due_days: '105',
      tasks: [
        {
          title: 'Internal testing and bug fixes',
          description: 'Comprehensive internal testing and resolution of identified issues.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 24,
          relative_due_days: '5'
        },
        {
          title: 'Beta testing with users',
          description: 'Recruit beta testers and conduct user acceptance testing.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '10'
        },
        {
          title: 'App store preparation',
          description: 'Prepare app store listings, screenshots, descriptions, and metadata.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '14'
        },
        {
          title: 'App store submission and review',
          description: 'Submit app to app stores and manage the review process.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '17'
        },
        {
          title: 'Launch monitoring and support',
          description: 'Monitor app launch, handle user feedback, and provide post-launch support.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '21'
        }
      ]
    }
  ]
  
  return await createTemplate(templateData, milestones)
}

/**
 * TEMPLATE 4: CONSULTING ENGAGEMENT
 * Professional consulting project template
 */
async function createConsultingTemplate(adminUserId) {
  log.header('CREATING CONSULTING ENGAGEMENT TEMPLATE')
  
  const templateData = {
    name: 'Strategic Consulting Engagement',
    description: 'Comprehensive consulting engagement template covering client onboarding, analysis, strategy development, and implementation support.',
    color: 'orange',
    created_by: adminUserId,
    is_default: true
  }
  
  const milestones = [
    {
      name: 'Client Onboarding & Discovery',
      description: 'Initial client engagement, stakeholder alignment, and comprehensive business analysis.',
      position: 0,
      relative_start_days: '0',
      relative_due_days: '7',
      tasks: [
        {
          title: 'Stakeholder alignment meeting',
          description: 'Conduct initial meeting to align expectations and define engagement scope.',
          position: 0,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 4,
          relative_due_days: '1'
        },
        {
          title: 'Business context analysis',
          description: 'Analyze client business context, industry landscape, and competitive position.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 12,
          relative_due_days: '3'
        },
        {
          title: 'Current state assessment',
          description: 'Evaluate current business processes, systems, and organizational structure.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '5'
        },
        {
          title: 'Key stakeholder interviews',
          description: 'Conduct in-depth interviews with key stakeholders across the organization.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '6'
        },
        {
          title: 'Discovery findings summary',
          description: 'Compile and present initial findings and identified opportunities.',
          position: 4,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 6,
          relative_due_days: '7'
        }
      ]
    },
    {
      name: 'Analysis & Needs Assessment',
      description: 'Deep-dive analysis, problem identification, and opportunity assessment.',
      position: 1,
      relative_start_days: '7',
      relative_due_days: '21',
      tasks: [
        {
          title: 'Data collection and analysis',
          description: 'Gather and analyze relevant business data, metrics, and performance indicators.',
          position: 0,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 20,
          relative_due_days: '4'
        },
        {
          title: 'Process mapping and evaluation',
          description: 'Map current business processes and identify inefficiencies and gaps.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '7'
        },
        {
          title: 'Competitive analysis',
          description: 'Conduct comprehensive competitive analysis and benchmarking study.',
          position: 2,
          priority: 'medium',
          visibility: 'internal',
          estimated_hours: 12,
          relative_due_days: '10'
        },
        {
          title: 'Root cause analysis',
          description: 'Identify root causes of key business challenges and performance gaps.',
          position: 3,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 14,
          relative_due_days: '12'
        },
        {
          title: 'Analysis report and recommendations',
          description: 'Create comprehensive analysis report with initial recommendations.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '14'
        }
      ]
    },
    {
      name: 'Strategy Development',
      description: 'Strategic solution design, roadmap creation, and implementation planning.',
      position: 2,
      relative_start_days: '21',
      relative_due_days: '42',
      tasks: [
        {
          title: 'Strategic framework development',
          description: 'Develop strategic framework and define success metrics and KPIs.',
          position: 0,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '5'
        },
        {
          title: 'Solution design and modeling',
          description: 'Design comprehensive solutions and create financial and operational models.',
          position: 1,
          priority: 'high',
          visibility: 'internal',
          estimated_hours: 24,
          relative_due_days: '10'
        },
        {
          title: 'Implementation roadmap',
          description: 'Create detailed implementation roadmap with phases, timelines, and dependencies.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '14'
        },
        {
          title: 'Risk assessment and mitigation',
          description: 'Identify potential risks and develop comprehensive mitigation strategies.',
          position: 3,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 10,
          relative_due_days: '17'
        },
        {
          title: 'Strategy presentation and approval',
          description: 'Present final strategy to stakeholders and secure approval for implementation.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '21'
        }
      ]
    },
    {
      name: 'Implementation Support & Handover',
      description: 'Implementation guidance, change management, and knowledge transfer.',
      position: 3,
      relative_start_days: '42',
      relative_due_days: '63',
      tasks: [
        {
          title: 'Implementation kickoff and planning',
          description: 'Launch implementation phase with detailed project planning and team setup.',
          position: 0,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 8,
          relative_due_days: '2'
        },
        {
          title: 'Change management support',
          description: 'Provide change management guidance and communication strategy.',
          position: 1,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 16,
          relative_due_days: '8'
        },
        {
          title: 'Training and capability building',
          description: 'Deliver training programs and build internal capabilities for sustainability.',
          position: 2,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 20,
          relative_due_days: '14'
        },
        {
          title: 'Progress monitoring and adjustments',
          description: 'Monitor implementation progress and make necessary strategy adjustments.',
          position: 3,
          priority: 'medium',
          visibility: 'client',
          estimated_hours: 12,
          relative_due_days: '18'
        },
        {
          title: 'Final handover and documentation',
          description: 'Complete project handover with comprehensive documentation and next steps.',
          position: 4,
          priority: 'high',
          visibility: 'client',
          estimated_hours: 10,
          relative_due_days: '21'
        }
      ]
    }
  ]
  
  return await createTemplate(templateData, milestones)
}

/**
 * Generic function to create a template with milestones and tasks
 */
async function createTemplate(templateData, milestones) {
  log.info(`Creating template: ${templateData.name}`)
  
  try {
    // Create the main template
    const { data: template, error: templateError } = await serviceClient
      .from('service_templates')
      .insert(templateData)
      .select()
      .single()
    
    if (templateError) throw templateError
    
    createdData.templates.push(template.id)
    log.success(`Template created: ${template.name} (ID: ${template.id})`)
    
    // Create milestones for this template
    for (const milestoneData of milestones) {
      log.info(`  Creating milestone: ${milestoneData.name}`)
      
      const { data: milestone, error: milestoneError } = await serviceClient
        .from('template_milestones')
        .insert({
          template_id: template.id,
          name: milestoneData.name,
          description: milestoneData.description,
          position: milestoneData.position,
          relative_start_days: milestoneData.relative_start_days,
          relative_due_days: milestoneData.relative_due_days
        })
        .select()
        .single()
      
      if (milestoneError) throw milestoneError
      
      createdData.milestones.push(milestone.id)
      log.success(`    Milestone created: ${milestone.name}`)
      
      // Create tasks for this milestone
      for (const taskData of milestoneData.tasks) {
        const { error: taskError } = await serviceClient
          .from('template_tasks')
          .insert({
            template_milestone_id: milestone.id,
            title: taskData.title,
            description: taskData.description,
            position: taskData.position,
            priority: taskData.priority,
            visibility: taskData.visibility,
            estimated_hours: taskData.estimated_hours,
            relative_due_days: taskData.relative_due_days
          })
        
        if (taskError) throw taskError
        
        createdData.tasks.push(taskData.title)
      }
      
      log.success(`    Created ${milestoneData.tasks.length} tasks for milestone`)
    }
    
    log.success(`Template ${templateData.name} completed with ${milestones.length} milestones`)
    return template
    
  } catch (error) {
    log.error(`Failed to create template ${templateData.name}: ${error.message}`)
    throw error
  }
}

/**
 * Validate created templates
 */
async function validateTemplates() {
  log.header('VALIDATING CREATED TEMPLATES')
  
  try {
    // Check template summary view
    const { data: templates, error: summaryError } = await serviceClient
      .from('template_summary')
      .select('*')
      .in('id', createdData.templates)
      .order('name')
    
    if (summaryError) throw summaryError
    
    log.info('Template validation results:')
    templates.forEach(template => {
      log.success(`  ${template.name}: ${template.milestone_count}M/${template.task_count}T (${template.is_default ? 'DEFAULT' : 'CUSTOM'})`)
    })
    
    // Validate total counts
    const totalMilestones = templates.reduce((sum, t) => sum + t.milestone_count, 0)
    const totalTasks = templates.reduce((sum, t) => sum + t.task_count, 0)
    
    log.success(`Total created: ${templates.length} templates, ${totalMilestones} milestones, ${totalTasks} tasks`)
    
    return true
  } catch (error) {
    log.error(`Template validation failed: ${error.message}`)
    return false
  }
}

/**
 * Main execution function
 */
async function createComprehensiveTemplates() {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('==================================================')
  console.log('PHASE 4: COMPREHENSIVE DEFAULT TEMPLATES')
  console.log('Creating industry-standard templates with precision')
  console.log('==================================================')
  console.log(colors.reset)
  
  try {
    // Get admin user for template ownership
    const adminUser = await getAdminUser()
    
    // Create all default templates
    await createEnterpriseWebsiteTemplate(adminUser.id)
    await createMarketingCampaignTemplate(adminUser.id)
    await createMobileAppTemplate(adminUser.id)
    await createConsultingTemplate(adminUser.id)
    
    // Validate all created templates
    const validationSuccess = await validateTemplates()
    
    if (validationSuccess) {
      console.log(`\n${colors.bright}${colors.green}PHASE 4 STEP 1 COMPLETED SUCCESSFULLY${colors.reset}`)
      console.log('==================================================')
      console.log(`✓ Templates created: ${createdData.templates.length}`)
      console.log(`✓ Milestones created: ${createdData.milestones.length}`)
      console.log(`✓ Tasks created: ${createdData.tasks.length}`)
      console.log(`✓ All templates validated successfully`)
      console.log('==================================================')
    } else {
      throw new Error('Template validation failed')
    }
    
  } catch (error) {
    log.error(`Failed to create comprehensive templates: ${error.message}`)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  createComprehensiveTemplates()
}

module.exports = { createComprehensiveTemplates, createdData }