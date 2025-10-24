
# Basic concepts how the api should work

```js
const prompt = (propmt: string) => {
  const state = null;
  return {};
};

prompt.prototype = {
  async config(chatRequest: ChatRequest) {
    const response = await this.prompt();
    return response;
  },
  value() {
    const state = null;
    return {};
  },
  has() {
    const state = null;
    return {};
  },
  isTool(): boolean {
    const state = null;
    return {};
  },
  stop(): void {

  }
};
```


const whatIsYourName = await prompt('What is your name?')
  .model('gpt-3.5-turbo')
  .config({
    temperature: 0.5,
    maxTokens: 100,
    topP: 0.9,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1
  })
  .stop('\n')
  .think('small')
  .run()



  if (whatIsYourName.isTool()) {

  }

const value = whatIsYourName.value()
