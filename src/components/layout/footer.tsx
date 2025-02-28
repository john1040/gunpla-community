export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Gunpla Community. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a 
              href="https://github.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              GitHub
            </a>
            <a 
              href="/terms" 
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Terms
            </a>
            <a 
              href="/privacy" 
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}