import get from 'lodash.get';
import {commandInput} from './SampleData';

function createCommands(input, output, path) {
  // created commands in same format as returned by graphql
    for (let key in input) {
        if (key != 'data') {
            output[key] = {}
            output[key].description = `select ${key}`
            output[key].path = [...path, key]
            output[key].data = input[key]

            // added querey to silence graphql errors. no use in our case
            output[key].query = `query Query{
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
            if (typeof input[key] === 'object') {
                output[key].commands = {}
                createCommands(input[key], output[key].commands, output[key].path)
            } else {
                // CluiOutput gives run commnad in terminal
                output[key].outputType = 'CluiOutput'
            }
        } else {
            output.list = {}
            output.list.outputType = 'CluiOutput'
            output.list.data = input[key]
            output.list.path = [...path, 'list']
            output.list.query = `query Query{
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
    // return a dummy function to supress error in QueryPromp.jsx
    return [()=> {}, {data: output}]
}


function getMarkdown(commandData, path) {
    let requiredPath = []
    for (let i=0; i<path.length; i++) {
      requiredPath.push('commands', path[i])
    }

    let markdown = get(commandData, requiredPath)
    let markdownString = "| value |  \n | --- | --- | \n ";
    if (markdown?.data && Array.isArray(markdown.data)) {
      for (let data of markdown.data) {
        markdownString = `${markdownString} | ${data.area} | \n`
      }
    } else {
      markdownString = `${markdownString} | ${markdown.data} | \n`
    }

    return markdownString

}
