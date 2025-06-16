import { useState } from 'react'
import { Search, Mail } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Searchh } from '@/components/searchh'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAuth } from '@/context/authContext'
import { Notification } from '@/interfaces/notification.interface'
import NotificationBell from '@/features/manager/components/notificationsBell'

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter((n) => !n.read).length
  const userId = user?.id 


  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      alert('Please fill in all fields')
      return
    }
    console.log('Contact form submitted:', contactForm)
    setContactForm({ subject: '', message: '' })
  }

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer:
        "To reset your password, go to the login page and click on 'Forgot Password'. Follow the instructions sent to your email to create a new password.",
    },
    {
      question: 'How can I update my profile information?',
      answer:
        "You can update your profile information in the 'User Info' section of your settings. Click on the fields you want to edit, make your changes, and click 'Save Changes'.",
    },
    {
      question: 'How do I change my notification preferences?',
      answer:
        "You can manage your notification preferences in the 'Notifications' section of your settings. Toggle the switches to enable or disable different types of notifications.",
    },
    {
      question: 'Is my personal information secure?',
      answer:
        'Yes, we take data security very seriously. All personal information is encrypted and stored securely. We never share your information with third parties without your consent.',
    },
  ]

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className='flex h-full flex-col'>
      {/* ===== Top Heading ===== */}
      <Header>
        <Searchh />
        <div className='ml-auto flex items-center space-x-4 rounded-3xl'>
          <ThemeSwitch />
          {userId && (
            <NotificationBell unreadCount={unreadCount} userId={userId} />
          )}
          <ProfileDropdown />
        </div>
      </Header>

      <div className='flex-1 rounded-3xl border bg-white p-6'>
        <h2 className='mb-6 text-xl font-medium'>Help Center</h2>

        <div className='mb-8'>
          <div className='relative mb-6'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-3xl text-muted-foreground' />
            <Input
              placeholder='Search for help...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='rounded-3xl border-gray-200 pl-10 focus:border-gray-300'
            />
          </div>

          <h3 className='mb-4 text-lg font-medium'>
            Frequently Asked Questions
          </h3>
          <Accordion type='single' collapsible className='w-full'>
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className='text-left hover:no-underline'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground'>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className='mt-8'>
          <h3 className='mb-4 text-lg font-medium'>Contact Support</h3>
          <div className='mb-6 grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='r flex items-center gap-3 rounded-3xl border p-4'>
              <div className='rounded-3xl bg-gray-100 p-3'>
                <Mail className='h-5 w-5' />
              </div>
              <div>
                <h4 className='font-medium'>Email Support</h4>
                <p className='text-sm text-muted-foreground'>
                  support@example.com
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label
                htmlFor='message'
                className='block rounded-3xl text-sm font-medium text-muted-foreground'
              >
                Message
              </label>
              <Textarea
                id='message'
                name='message'
                value={contactForm.message}
                onChange={handleContactChange}
                placeholder='Please describe your issue in detail...'
                className='min-h-[150px] rounded-3xl border-gray-200 focus:border-gray-300'
                required
              />
            </div>

            <div className='flex justify-end'>
              <Button
                type='submit'
                className='rounded-3xl bg-black px-8 py-2 text-white hover:bg-gray-800'
                disabled={!contactForm.subject || !contactForm.message}
              >
                Send Message
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
