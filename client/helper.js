import get from 'lodash.get';
import {commandInput} from './SampleData';

// this query is used only to supress graphql error, no real use
const grqphqlDummyQuery = `query Query{
  clui {
  contacts {
  list {
  ...CluiOutput
  }
  }
  }
  }
  
  fragment CluiOutput on CluiOutput {
    ...on CluiSuccessOutput {
      message
    }
    ...on CluiMarkdownOutput {
      markdown
    }
    ...on CluiErrorOutput {
      error
    }
  }`


function createCommands(input, output, path) {
  // created commands in same format as returned by graphql
    for (let key in input) {
        if (key != 'data') {
            output[key] = {}
            output[key].description = `select ${key}`
            output[key].path = [...path, key] // used in fetching data to display on click of 'run'
            output[key].data = input[key] // data to disply on click of 'run'
            output[key].query = grqphqlDummyQuery
            
            if (typeof input[key] === 'object') {
                output[key].commands = {}
                createCommands(input[key], output[key].commands, output[key].path)
            } else {
                // CluiOutput gives run commnad in terminal
                output[key].outputType = 'CluiOutput'
            }
        } else {
            // 'data' property will be listed in tabular form and it will have command 'list'
            output.list = {}
            output.list.outputType = 'CluiOutput'
            output.list.data = input[key]
            output.list.path = [...path, 'list']
            output.list.query = grqphqlDummyQuery
        }
    }
    return output;
}

export const useCustomQuery =()=> {
    let commands = {
      data: {
          command: {
              path: ['clui'],
              commands: {}
          }
      }
    }
    createCommands(commandInput, commands.data.command.commands, commands.data.command.path)
    return commands
}


export const getQueryResult = (path) => {
  // create result when run is clicked
    let {data} = useCustomQuery()
    let output = {}
    let temp = output
    for(let i=0; i<path.length; i++) {
        if (i !== path.length-1) {
            temp[path[i]] = {__typename: path[i]}
        } else {
          // CluiMarkdownOutput get displayed as result
            temp[path[i]] = {
                __typename: 'CluiMarkdownOutput',
                markdown: getMarkdown(data.command, path.slice(1))
            }
        }
        temp = temp[path[i]]
    }
    // return a dummy function at index 0 to supress error in QueryPromp.jsx
    return [()=> {}, {data: output, called:true, loading:false}]
}


function getMarkdown(commandData, path) {
    // return markdown string to disaply on click of 'run' 
    let requiredPath = []
    for (let i=0; i<path.length; i++) {
      // add commands to path, then lodash can fetch required data to display
      requiredPath.push('commands', path[i])
    }

    let markdown = get(commandData, requiredPath)
    let markdownString = "| value |  \n | --- | --- | \n ";
    if (markdown?.data && Array.isArray(markdown.data)) {
      for (let data of markdown.data) {
        // data needs to be displayd in tabular form
        markdownString = `${markdownString} | ${data.area} | \n`
      }
    } else {
      // add single value to markup
      markdownString = `${markdownString} | ${markdown.data} | \n`
    }

    return markdownString

}
