import TokenBooking from './components/TokenBooking'
import './App.css'

function App() {
  return (
    <div className="min-h-fit  flex flex-col">
      <div className="flex-1">
        <TokenBooking />
      </div>
      <footer className="py-4 text-center text-sm md:text-xl text-muted-foreground mt-40 absolute bottom-0 left-1/2 -translate-x-1/2">
        Developed by{' '}
        <a
          href="https://www.linkedin.com/in/vidit-chawda/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline underline-offset-4 hover:opacity-90"
        >
          Vidit Chawda
        </a>
      </footer>
    </div>
  )
}

export default App
