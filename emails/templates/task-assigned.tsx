import { Text, Button } from '@react-email/components'
import { EmailLayout } from '../components/layout'

interface TaskAssignedEmailProps {
  assigneeName: string
  taskTitle: string
  taskDescription?: string
  dueDate?: string
  priority?: string
  serviceName?: string
  taskUrl: string
}

export function TaskAssignedEmail({
  assigneeName,
  taskTitle,
  taskDescription,
  dueDate,
  priority,
  serviceName,
  taskUrl
}: TaskAssignedEmailProps) {
  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  }

  return (
    <EmailLayout>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        New Task Assigned 📋
      </Text>
      
      <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>
        Hi {assigneeName},
      </Text>

      <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '24px' }}>
        You've been assigned a new task:
      </Text>

      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '16px',
        borderRadius: '6px',
        marginBottom: '24px',
      }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          {taskTitle}
        </Text>
        
        {taskDescription && (
          <Text style={{ fontSize: '14px', margin: '0 0 12px 0' }}>
            {taskDescription}
          </Text>
        )}

        <div style={{ fontSize: '14px' }}>
          {serviceName && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Project:</strong> {serviceName}
            </div>
          )}
          {dueDate && (
            <div style={{ marginBottom: '4px' }}>
              <strong>Due:</strong> {new Date(dueDate).toLocaleDateString()}
            </div>
          )}
          {priority && (
            <div>
              <strong>Priority:</strong>{' '}
              <span style={{ 
                color: priorityColors[priority as keyof typeof priorityColors] || '#6b7280',
                fontWeight: 'bold'
              }}>
                {priority.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      <Button
        href={taskUrl}
        style={{
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          display: 'inline-block',
          fontWeight: 'bold',
        }}
      >
        View Task Details
      </Button>
    </EmailLayout>
  )
}