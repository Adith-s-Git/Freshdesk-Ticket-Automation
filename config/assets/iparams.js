
let client
init();

async function init() {
  client = await app.initialized();
  console.log(
    client
  )
}

function domainChange(newValue) {
  //Input type validation
  console.log(newValue);
  let regex = /[A-Za-z]+[0-9]+\.freshdesk\.com/i;
//   let regex = /^[A-Za-z]+[A-Za-z0-9]*[0-9]+\.freshdesk\.com$/i


  console.log(regex.test(`https://${newValue}.freshdesk.com`))

  if(!regex.test({newValue})){
    utils.set("domain_name", { hint: "Invalid domain" })
  }


//   utils.set("domain_name", { hint: "Enter your domain name" })

    
}

function validateTicketCount(){
    utils.set("total_tickets", {min: 1, max: 50})

}

function APIeyChange(arg) {
    console.log(utils.get("domain_name"))
    console.log(client,arg)
    //API call by using arg which is the API Key entered by the app user
    //value is the response returned by the API call
      return value=="" ? "Invalid API Key": "";
    }

async function APIKeyChange(newValue) {
  let validation = false
  if (newValue) {
    try {
      let res = await client.request.invokeTemplate("validateAPI", {
        context: {
          domain: utils.get("domain_name"),
          apiKey: newValue
        }
      })
      if(res.status === 200){
        validation= true
        utils.set("domain_name", { label: "Enter your freshdesk domain name" })
        utils.set("api_key", { label: "Enter your API key" })
      }else{
        utils.set("domain_name", { hint: "Ensure If the domain is valid" })
        utils.set("api_key", { hint: "Ensure If the API is valid" })
        validation = false

      }
    } catch (e) {
      utils.set("domain_name", { hint: "Ensure If the domain is valid" })
      utils.set("api_key", { hint: "Ensure If the API is valid" })
      validation = false
    }
  }
  return validation
}