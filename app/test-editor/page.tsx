"use client"

import { RichTextEditor } from '@/shared/components/ui/rich-text-editor'
import { PageLayout } from '@/shared/components/layout/page-layout'

export default function TestEditorPage() {
  return (
    <PageLayout title="Rich Text Editor Test">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Admin/Team Full Editor</h2>
          <RichTextEditor 
            placeholder="Full editor with all features..."
            userRole="admin"
            minimal={false}
            onChange={(content) => console.log('Admin content:', content)}
          />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Team Minimal Editor</h2>
          <RichTextEditor 
            placeholder="Team minimal toolbar..."
            userRole="team_member"
            minimal={true}
            onChange={(content) => console.log('Team content:', content)}
          />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Client Editor</h2>
          <RichTextEditor 
            placeholder="Client basic editor..."
            userRole="client"
            minimal={false}
            onChange={(content) => console.log('Client content:', content)}
          />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Read-only Display</h2>
          <RichTextEditor 
            content="<h2>Sample Content</h2><p>This is <strong>read-only</strong> content with <em>formatting</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul>"
            editable={false}
            showToolbar={false}
          />
        </div>
      </div>
    </PageLayout>
  )
}