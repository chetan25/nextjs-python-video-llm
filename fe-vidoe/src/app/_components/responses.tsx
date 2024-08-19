type Answers = { question: string; answer: string; imgData: string }[];

const Responses = ({
  debug,
  answers = [],
}: {
  debug: Function;
  answers: Answers;
}) => {
  return answers.length > 0 ? (
    <div
      id="answers"
      className="flex p-12 text-md leading-relaxed relative min-h-2/4 overflow-hidden overflow-y-scroll"
    >
      <div className="flex w-full flex-col">
        {answers.map((answer) => {
          return (
            <>
              <div className="w-full">Q: {answer.question}</div>
              <div className="self-end text-end w-full border-b-4 border-gray-200">
                <p>A: {answer.answer}</p>
                <button
                  type="button"
                  onClick={() => debug(answer.imgData)}
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Debug
                </button>
              </div>
            </>
          );
        })}
      </div>
    </div>
  ) : null;
};

export default Responses;
