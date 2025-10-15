import ReportForm from '../components/ReportForm';

function HomePage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen scroll-smooth">
      <section 
        className="h-screen flex flex-col items-center justify-center bg-cover bg-center bg-fixed" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594495894542-a46123b4841a?q=80&w=2070&auto=format&fit=crop')" }}
      >
        <div className="bg-black bg-opacity-60 p-8 md:p-12 rounded-xl text-center max-w-3xl mx-4">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-lg">
            Your Voice, Your City.
          </h1>
          <p className="text-lg md:text-2xl mb-8 text-gray-200">
            Report local civic issues in real-time. Make a difference.
          </p>
          <a 
            href="#report-form" 
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 duration-300 inline-block"
          >
            Report an Issue
          </a>
        </div>
      </section>

      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-2">How It Works</h2>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Resolving issues in your neighborhood is just three simple steps away.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-gray-900 p-8 rounded-xl shadow-2xl transform hover:-translate-y-2 transition-transform duration-300">
              <div className="text-cyan-400 text-6xl font-bold mb-4">1</div>
              <h3 className="text-2xl font-bold mb-3">Submit a Report</h3>
              <p className="text-gray-400">
                Use our simple form to describe the issue. Add a photo to provide more clarity.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl shadow-2xl transform hover:-translate-y-2 transition-transform duration-300">
              <div className="text-cyan-400 text-6xl font-bold mb-4">2</div>
              <h3 className="text-2xl font-bold mb-3">Authority Notified</h3>
              <p className="text-gray-400">
                Your report is instantly routed to the correct municipal department for action.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl shadow-2xl transform hover:-translate-y-2 transition-transform duration-300">
              <div className="text-cyan-400 text-6xl font-bold mb-4">3</div>
              <h3 className="text-2xl font-bold mb-3">Track to Resolution</h3>
              <p className="text-gray-400">
                You can track the status of your report and receive updates as it gets resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="report-form" className="py-20 flex justify-center items-center bg-gray-900">
        <ReportForm />
      </section>
    </div>
  );
}

export default HomePage;