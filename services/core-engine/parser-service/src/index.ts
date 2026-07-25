import { CodeParser } from './parser';

const sampleCode = `
class Example {
  hello() {
    console.log("World");
  }
}

function standalone() {
  return true;
}
`;

const parser = new CodeParser();
const result = parser.parse(sampleCode);

console.log("Parsed result:", JSON.stringify(result, null, 2));

// Later we will connect this to a message queue or API to accept code and save to DB
