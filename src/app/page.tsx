import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Monitor, TrendingUp, Camera } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="flex flex-col items-center justify-center pt-12">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Powered by <span className="text-blue-600">Donation</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Access the services you need while advancing the causes you value. You select the service, you select the charity.
        </p>
        

        <div className="grid md:grid-cols-3 gap-8">
          {/* Web Design Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center flex flex-col h-full">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed flex-grow">
              Someone got <span className="font-semibold">Professional Website Design</span> by donating <span className="font-bold text-green-600">$150</span> to <span className="font-semibold text-blue-600">Cancer Research Australia</span>
            </p>
            <Link 
              href="/browse"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-auto"
            >
              Donate & Get
            </Link>
          </div>
          
          {/* Business Consulting Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center flex flex-col h-full">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed flex-grow">
              Someone got <span className="font-semibold">Business Strategy Session</span> by donating <span className="font-bold text-green-600">$75</span> to <span className="font-semibold text-blue-600">Beyond Blue</span>
            </p>
            <Link 
              href="/browse"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-auto"
            >
              Donate & Get
            </Link>
          </div>
          
          {/* Photography Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center flex flex-col h-full">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Camera className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed flex-grow">
              Someone got <span className="font-semibold">Family Photo Session</span> by donating <span className="font-bold text-green-600">$200</span> to <span className="font-semibold text-blue-600">RSPCA NSW</span>
            </p>
            <Link 
              href="/browse"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-auto"
            >
              Donate & Get
            </Link>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Link 
            href="/browse" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Services
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}