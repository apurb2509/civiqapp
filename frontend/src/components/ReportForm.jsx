function ReportForm() {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Report a Civic Issue
        </h2>
        <form>
          <div className="mb-4">
            <label htmlFor="issueType" className="block text-gray-300 text-sm font-bold mb-2">
              Type of Issue
            </label>
            <select
              id="issueType"
              name="issueType"
              className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500"
            >
              <option>Select an issue type...</option>
              <option value="pothole">Pothole</option>
              <option value="tree_cutting">Tree Cutting</option>
              <option value="water_clogging">Water Clogging</option>
              <option value="debris">Debris / Garbage</option>
              <option value="unsafe_street">Unsafe Street (e.g., no light)</option>
            </select>
          </div>
  
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Describe the issue in detail..."
              className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500"
            ></textarea>
          </div>
  
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 w-full"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  export default ReportForm;