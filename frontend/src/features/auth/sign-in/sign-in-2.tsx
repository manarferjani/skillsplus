import { UserAuthForm } from './components/user-auth-form'

export default function SignIn2() {
  return (
    <div
      className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: 'url("/images/loginn.jpeg")', // Replace with your image path
            backgroundSize: 'cover',
            //filter: 'brightness(0.5) contrast(1)' // Enhanced filter
          }}
        />
        <div className='relative z-20 flex items-center text-lg font-medium pt-0 mt-[-3rem] ml-[-2rem]'>
          <img
            src='/images/skLogo.png'
            alt='SkillBloom Logo'
            style={{ height: '10rem' }}
            className='h-28 w-auto'
          />
        </div>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p
              className='text-lg'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 500,
              }}
            >
              &ldquo;Empower your skills. Track your evolution. Unlock your true
              potential.&rdquo;
            </p>
            <footer
              className='text-sm'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
              }}
            ></footer>
          </blockquote>
        </div>
      </div>
      <div className='h-full text-white' style={{ backgroundColor: '#bee1e6' }}>
        <div className='mx-auto flex h-full w-full flex-col justify-center space-y-2 p-8 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1
              className='text-2xl font-semibold tracking-tight text-white'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
              }}
            >
              Login
            </h1>
            <p
              className='text-sm text-gray-800'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
              }}
            >
              Enter your email and password below <br />
              to log into your account
            </p>
          </div>
          <UserAuthForm className='text-white' />
          <p
            className='px-8 text-center text-sm text-gray-800'
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}
          >
            By clicking login, you agree to our{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary'
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
