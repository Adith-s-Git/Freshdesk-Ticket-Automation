
exports = {
  // args is a JSON block containing the payload information.
  // args['iparam'] will contain the installation parameter values.

  onTicketCreateHandler: function(args) {
    console.info("onTicketCreateHandler invoked", args);  
  },

  onAppInstallCallback: async function(args) {
    console.info("onAppInstallCallback invoked", args);
    try {
      const totalNumberOfTickets = args['iparams']['total_tickets'];
      const scheduleTickets = await this.createScheduledTicket(totalNumberOfTickets);
      console.info("Scheduled ticket creation initiated", scheduleTickets);
      renderData();
    } catch (error) {
      console.error("Error in onAppInstallCallback: ", error);
      renderData();
    }
  },

  onAppUpdateCallback: async function(args) {
    console.info("onAppUpdateCallback invoked", args);
    try {
      const totalNumberOfTickets = args['iparams']['total_tickets'];
      const currentSchedule = await this.fetchTicketSchedule();
      console.info("Current schedule fetched before update", currentSchedule);
      const { data, schedule_at, action } = currentSchedule;
      const { total_tickets_remaining, ticket_ids, ticket_id, requester_id } = data;

      // Params: totalTickets, remainingTickets, ticketId, ticketIds, nextScheduledTime, action, requesterId
      const scheduleTickets = await this.updateTicketScheduleNextDay(totalNumberOfTickets, total_tickets_remaining, ticket_id, ticket_ids, schedule_at, action, requester_id);
      console.info("Schedule updated after app update", scheduleTickets);
      renderData();
    } catch (error) {
      console.error("Error in onAppUpdateCallback: ", error);
      renderData();
    }
  },

  onAppUninstallCallback: async function() {
    try {
      const scheduleResponse = await this.deleteScheduledTicket();
      console.info("Scheduled event deleted successfully on app uninstall", scheduleResponse);
      renderData();
    } catch (error) {
      console.error("Error in onAppUninstallCallback: ", error);
      renderData();
    }
  },

  onScheduledEventHandler: async function(args) {
    try {
      console.info("onScheduledEventHandler invoked", args['data']['action']);
      
      // Handle ticket creation action
      if (args['data']['action'] === "ticket_creation") {
        if (args['data']['total_tickets_remaining'] > 0) {
          const ticketIds = args['data']['ticket_ids'];
          const ticketResponse = JSON.parse(await this.autoCreateTicket());
          const requesterId = ticketResponse.requester_id;
          const ticketId = ticketResponse.id;
          ticketIds.push(ticketResponse.id);
          const nextScheduledTime = this.convertToUTCAndAddMinutes(args['timestamp'], 5);
          const updatedScheduleResponse = await this.updateTicketSchedule(args["iparams"]["total_tickets"], args['data']['total_tickets_remaining'] - 1, ticketId, ticketIds, nextScheduledTime, "agent_reply", requesterId);
          console.info("Schedule updated for next action 'agent_reply'", updatedScheduleResponse);
          const scheduleResponse = await this.fetchTicketSchedule();
          console.info(`Remaining Tickets: ${scheduleResponse.data.total_tickets_remaining} & Ticket IDs: ${scheduleResponse.data.ticket_ids} & Next Action: agent_reply`);
        } else {
          console.info("All tickets created for the day");
          const currentTimeInISO = new Date(args['timestamp']).toISOString();
          const nextDayScheduledTime = this.getNextDay9AMISTInUTC(currentTimeInISO);
          console.info("Next day's scheduled time:", nextDayScheduledTime);
          await this.updateTicketScheduleNextDay(args['iparams']['total_tickets'], args['iparams']['total_tickets'], 0, [], nextDayScheduledTime, "ticket_creation", 0);
          console.info("Next schedule set for 9 AM IST", this.convertToIST(nextDayScheduledTime));
        }
      } else if (args['data']['action'] === "agent_reply") {
        // Handle agent reply action
        const scheduleResponse = await this.fetchTicketSchedule();
        console.info("Current schedule at 'agent_reply' action", scheduleResponse);
        const ticketId = args['data']['ticket_id'];
        const ticketArray = args['data']['ticket_ids'];

        console.info("Processing agent reply for ticket IDs:", ticketArray);

       

        ticketArray.forEach((ticketId) => {
          try {
            const mock_index = Math.floor(Math.random() * 25)
            const body = {
              body: `<b>Agent Reply:</b> ${mock[mock_index]['agentReply']} `,
              private: false,
              incoming: true
            };
            console.info("Creating agent reply for ticket ID:", ticketId);
            $request.invokeTemplate("createNotes", {
              context: { ticketId: ticketId },
              body: JSON.stringify(body),
              options: { retryDelay: 1000, maxAttempts: 5 }
            }).then(() => {
              console.info(`Agent reply created successfully for ticket ID ${ticketId}`);
            },(error) => {
              console.error(`Error creating agent reply for ticket ID ${ticketId}:`, error);
              if(error.status === 429){
                console.error("Agent Reply API LIMIT Exceeded, Request will be retried in some time ")
              }
              if(error.status=== 502){
                console.error(`Error Source: ${error.errorSource} & Response: ${error.response}`)
              }
            });
          } catch (error) {
            console.error(`Error processing agent reply for ticket ID ${ticketId}:`, error);
          }
        });

        const nextScheduledTime = this.convertToUTCAndAddMinutes(args['timestamp'], 5);
        await this.updateTicketSchedule(args['data']['total_tickets'], scheduleResponse.data.total_tickets_remaining, ticketId, scheduleResponse.data.ticket_ids, nextScheduledTime, "customer_reply", args['data']['user_id']);
        console.info("Schedule updated for next action 'customer_reply'");
      } else if (args['data']['action'] === 'customer_reply') {
        // Handle customer reply action
        const scheduleResponse = await this.fetchTicketSchedule();
        console.info("Current schedule at 'customer_reply' action", scheduleResponse);
        const ticketId = args['data']['ticket_id'];
        const ticketArray = args['data']['ticket_ids'];


        ticketArray.forEach((ticketId) => {
          try {
            const mock_index = Math.floor(Math.random() * 25)
            const body = {
              body: `<b>Customer Reply:</b> ${mock[mock_index]['customerResponse']}`,
              private: false,
              incoming: true,
              user_id: args['data']['user_id']
            };

            console.info("Creating customer reply for ticket ID:", ticketId);
            $request.invokeTemplate("createNotes", {
              context: { ticketId: ticketId },
              body: JSON.stringify(body),
              options: { retryDelay: 1000, maxAttempts: 5 }
            }).then(() => {
              console.info(`Customer reply created successfully for ticket ID ${ticketId}`);
            },(error) => {
              console.error(`Error creating customer reply for ticket ID ${ticketId}:`, error);
              if(error.status === 429){
                console.error("Customer Reply API LIMIT Exceeded, Request will be retried in some time ")
              }
              if(error.status=== 502){
                console.error(`Error Source: ${error.errorSource} & Response: ${error.response}`)
              }
            });
          } catch (error) {
            console.error(`Error processing customer reply for ticket ID ${ticketId}:`, error);
          }
        });

        const nextScheduledTime = this.convertToUTCAndAddMinutes(args['timestamp'], 5);
        await this.updateTicketSchedule(args['iparams']['total_tickets'], scheduleResponse.data.total_tickets_remaining, ticketId, scheduleResponse.data.ticket_ids, nextScheduledTime, "ticket_creation");
        console.info("Schedule updated for next action 'ticket_creation'");
      }

    } catch (error) {
      console.error("Error in onScheduledEventHandler: ", error);
    }
  },

  fetchTicketSchedule: async function() {
    try {
      const data = await $schedule.fetch({
        name: "auto_ticket_creation"
      });
      console.info("Scheduled event fetched successfully", data);
      return data;
    } catch (error) {
      console.error("Error fetching scheduled event: ", error);
      return { message: "An error occurred. Please try again later." };
    }
  },

  updateTicketSchedule: async function(totalTickets, remainingTickets, ticketId, ticketIds, nextScheduledTime, action, requesterId) {
    try {
      const data = await $schedule.update({
        name: "auto_ticket_creation",
        data: {
          total_tickets_scheduled: totalTickets,
          total_tickets_remaining: remainingTickets,
          ticket_id: ticketId,
          ticket_ids: ticketIds,
          action: action,
          current_time: new Date().toISOString(),
          incoming: false,
          user_id: requesterId
        },
        schedule_at: nextScheduledTime,
        repeat: { time_unit: "minutes", frequency: 5 }
      });
      console.info("Scheduled event updated successfully", data);
      return data;
    } catch (error) {
      console.error("Error updating scheduled event: ", error);
      return error;
    }
  },

  updateTicketScheduleNextDay: async function(totalTickets,remainingTickets, ticketId, ticketIds, nextScheduledTime,action,requesterId){
    try {
      const data = await $schedule.update({
        name: "auto_ticket_creation",
        data: {
          total_tickets_scheduled: totalTickets,
          total_tickets_remaining: remainingTickets,
          ticket_id: ticketId,
          ticket_ids : ticketIds,
          action: action,
          current_time: new Date().toISOString(),
          user_id: requesterId
        },
        schedule_at: nextScheduledTime,
        repeat: {
          time_unit: "minutes",
          frequency: 5
        }
      });
      console.info("Update Scheduled Event Success",data)
      return data

    }
    catch (error) {
      console.error("Update Scheduled Event Error", error)
      return error
    }

  },

  createScheduledTicket: async function(totalTickets){
    try{
      
      const currentTimestamp = Date.now()
      const data =  await $schedule.create({
         name: "auto_ticket_creation",
         data: {
           total_tickets_scheduled: totalTickets,
           total_tickets_remaining: totalTickets,
           ticket_ids : [],
           action: "ticket_creation",
           current_time: new Date().toISOString(),
           reply_type:"agent"

         },
         schedule_at: this.convertToUTCAndAddMinutes(currentTimestamp,5),
         repeat: {
           time_unit: "minutes",
           frequency: 5
         }
       });


        console.info("Create Scheduled Event Success",data)
        return data

   
     }catch(error){
       console.error('Create Scheduled Event Error',error)
       return error
      
     }

    
  },


  deleteScheduledTicket: async function(){
    try{
      const data =  await $schedule.delete({
         name: "auto_ticket_creation"
       });
       console.info("Delete Schedule Event Success",data)
       return data

     }catch(error){
       console.error('Delete Scheduled Event Error',error)
       return error
     }
  },

  autoCreateTicket: async function(){
    try{
      const mock_index = Math.floor(Math.random() * 25)
      
      const requestPayload = {
        
        subject: mock[mock_index]["subject"],
        name: mock[mock_index]['name'],
        phone: mock[mock_index]['phoneNumber'],
        description: mock[mock_index]['customerReasonForSupport'],
        source: 3,
        priority: Math.floor(Math.random() * 4)+1,
        tags:mock[mock_index]['tags']
      
    }
  
      const createTickteData =  await $request.invokeTemplate("createTicket", {
         body: JSON.stringify(requestPayload)
       });
       console.info("Auto Create Ticket Function",createTickteData.status)
       return createTickteData.response;


    }catch(error){
      console.error("Auto Ticket Created Error",error);
      return error;

    }
  },

   convertToUTCAndAddMinutes: function(timestamp, minutes) {
    const date = new Date(timestamp); // Convert timestamp to Date object
    date.setMinutes(date.getMinutes() + minutes); // Add 5 minutes
    return date.toISOString(); // Convert to UTC string
  },

     getNextDay9AMISTInUTC:function(utcTimestamp) {
      const date = new Date(utcTimestamp); // Current time in UTC
  
      // Move to the next day
      date.setUTCDate(date.getUTCDate() + 1);
  
      // Set time to 9:00 AM IST (UTC+5:30)
      date.setUTCHours(3, 30, 0, 0); // Convert 9:00 AM IST to UTC (9 - 5:30 = 3:30 AM UTC)
  
      return date.toISOString(); // Return the UTC timestamp
  },

   convertToIST:function(utcTimestamp) {
    const date = new Date(utcTimestamp);
    return date.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
    });
}
  
};

const mock = [
  {
     "name":"John Doe",
     "phoneNumber":"123-456-7890",
     "subject":"Order Confirmation Issue",
     "tags":[
        "Order",
        "Confirmation",
        "Delayed"
     ],
     "customerReasonForSupport":"I haven't received an order confirmation email yet.",
     "agentReply":"Apologies for the delay. I will check the order status for you.",
     "customerResponse":"Thank you! Please do it quickly."
  },
  {
     "name":"Jane Smith",
     "phoneNumber":"234-567-8901",
     "subject":"Payment Failure",
     "tags":[
        "Payment",
        "Transaction",
        "Failed"
     ],
     "customerReasonForSupport":"My payment didn't go through during checkout.",
     "agentReply":"I will assist you in processing your payment. Could you try again with a different method?",
     "customerResponse":"Sure, I'll try another card."
  },
  {
     "name":"Alice Johnson",
     "phoneNumber":"345-678-9012",
     "subject":"Product Return Process",
     "tags":[
        "Return",
        "Refund",
        "Policy"
     ],
     "customerReasonForSupport":"I want to return a product but I’m unsure about the process.",
     "agentReply":"I can guide you through the return process. Do you have the order number?",
     "customerResponse":"Yes, the order number is #A2345."
  },
  {
     "name":"Bob Miller",
     "phoneNumber":"456-789-0123",
     "subject":"Incorrect Item Received",
     "tags":[
        "Shipping",
        "Wrong Item",
        "Refund"
     ],
     "customerReasonForSupport":"I received the wrong item in my order.",
     "agentReply":"Sorry for the mix-up! Let me check the details of your order and arrange a return.",
     "customerResponse":"Thank you, I hope the correct item arrives soon."
  },
  {
     "name":"Charlie Davis",
     "phoneNumber":"567-890-1234",
     "subject":"Discount Code Not Working",
     "tags":[
        "Promotion",
        "Discount",
        "Coupon"
     ],
     "customerReasonForSupport":"The discount code doesn't seem to be working on checkout.",
     "agentReply":"I’ll look into the issue with the code and get back to you shortly.",
     "customerResponse":"I appreciate it, thanks."
  },
  {
     "name":"David Green",
     "phoneNumber":"678-901-2345",
     "subject":"Shipping Delay",
     "tags":[
        "Shipping",
        "Delay",
        "Tracking"
     ],
     "customerReasonForSupport":"My order hasn’t arrived yet, and the tracking hasn’t updated.",
     "agentReply":"We apologize for the delay. Let me investigate your tracking status.",
     "customerResponse":"Please update me as soon as possible."
  },
  {
     "name":"Emily White",
     "phoneNumber":"789-012-3456",
     "subject":"Order Cancellation",
     "tags":[
        "Order",
        "Cancellation",
        "Refund"
     ],
     "customerReasonForSupport":"I need to cancel my order before it ships.",
     "agentReply":"I’ll help you cancel the order right away and process a refund.",
     "customerResponse":"Thank you for your help."
  },
  {
     "name":"Frank Harris",
     "phoneNumber":"890-123-4567",
     "subject":"Account Login Issue",
     "tags":[
        "Account",
        "Login",
        "Password"
     ],
     "customerReasonForSupport":"I can’t log in to my account; I forgot my password.",
     "agentReply":"I'll reset your password for you. Check your email for the reset link.",
     "customerResponse":"Got it, thanks!"
  },
  {
     "name":"Grace Lewis",
     "phoneNumber":"901-234-5678",
     "subject":"Product Availability",
     "tags":[
        "Stock",
        "Availability",
        "Restock"
     ],
     "customerReasonForSupport":"I want to know when an item will be back in stock.",
     "agentReply":"I’ll check the stock availability and notify you when it’s available again.",
     "customerResponse":"Please let me know as soon as it's back."
  },
  {
     "name":"Henry Clark",
     "phoneNumber":"012-345-6789",
     "subject":"Gift Card Issue",
     "tags":[
        "Payment",
        "Gift Card",
        "Redemption"
     ],
     "customerReasonForSupport":"I can't seem to redeem my gift card during checkout.",
     "agentReply":"Let me look into your gift card issue and help you with redemption.",
     "customerResponse":"Thanks for assisting me!"
  },
  {
     "name":"Irene King",
     "phoneNumber":"123-456-7891",
     "subject":"Subscription Renewal",
     "tags":[
        "Subscription",
        "Billing",
        "Auto-renewal"
     ],
     "customerReasonForSupport":"I want to cancel my subscription before it renews.",
     "agentReply":"I’ll cancel the renewal for you and confirm your subscription status.",
     "customerResponse":"Thank you for taking care of that."
  },
  {
     "name":"Jackie Scott",
     "phoneNumber":"234-567-8902",
     "subject":"Missing Item in Order",
     "tags":[
        "Shipping",
        "Missing Item",
        "Order"
     ],
     "customerReasonForSupport":"I received my order but one item was missing.",
     "agentReply":"I apologize for the missing item. I will arrange for a replacement to be sent out.",
     "customerResponse":"Thanks for resolving this quickly."
  },
  {
     "name":"Kyle Moore",
     "phoneNumber":"345-678-9013",
     "subject":"Order Processing Delay",
     "tags":[
        "Order",
        "Processing",
        "Delay"
     ],
     "customerReasonForSupport":"My order is stuck in processing for too long.",
     "agentReply":"Let me check with the warehouse team and expedite your order processing.",
     "customerResponse":"Appreciate your help, please hurry."
  },
  {
     "name":"Lily Allen",
     "phoneNumber":"456-789-0124",
     "subject":"International Shipping",
     "tags":[
        "Shipping",
        "International",
        "Customs"
     ],
     "customerReasonForSupport":"Can you confirm if you offer international shipping?",
     "agentReply":"Yes, we do offer international shipping. I'll send you the details for your location.",
     "customerResponse":"Thanks, I'll review the options."
  },
  {
     "name":"Michael Adams",
     "phoneNumber":"567-890-1235",
     "subject":"Tracking Update",
     "tags":[
        "Shipping",
        "Tracking",
        "Lost Package"
     ],
     "customerReasonForSupport":"My tracking number shows no updates for days.",
     "agentReply":"I will contact the courier and get an update on your package's status.",
     "customerResponse":"Please let me know ASAP."
  },
  {
     "name":"Nina Robinson",
     "phoneNumber":"678-901-2346",
     "subject":"Product Exchange",
     "tags":[
        "Exchange",
        "Wrong Size",
        "Policy"
     ],
     "customerReasonForSupport":"I received the wrong size and need to exchange it.",
     "agentReply":"I'll send you an exchange form right away to process the size change.",
     "customerResponse":"Thanks, I’ll fill it out."
  },
  {
     "name":"Oscar Williams",
     "phoneNumber":"789-012-3457",
     "subject":"Account Verification",
     "tags":[
        "Account",
        "Verification",
        "Identity"
     ],
     "customerReasonForSupport":"I need help verifying my account.",
     "agentReply":"Please provide your account details and I will assist with verification.",
     "customerResponse":"Here's my information, thanks for your help."
  },
  {
     "name":"Patricia Martinez",
     "phoneNumber":"890-123-4568",
     "subject":"Return Shipping Label",
     "tags":[
        "Return",
        "Shipping",
        "Label"
     ],
     "customerReasonForSupport":"I need a return shipping label for my order.",
     "agentReply":"I will send you the return label via email shortly.",
     "customerResponse":"Thank you so much."
  },
  {
     "name":"Quincy Carter",
     "phoneNumber":"901-234-5679",
     "subject":"Product Description Mismatch",
     "tags":[
        "Product",
        "Description",
        "Incorrect"
     ],
     "customerReasonForSupport":"The product description on your website does not match the item I received.",
     "agentReply":"I’m sorry for the confusion. I will update the product description immediately.",
     "customerResponse":"Thanks for clarifying."
  },
  {
     "name":"Rachel Young",
     "phoneNumber":"012-345-6790",
     "subject":"Price Adjustment Request",
     "tags":[
        "Pricing",
        "Refund",
        "Discount"
     ],
     "customerReasonForSupport":"I noticed the item I bought is now on sale, can I get a price adjustment?",
     "agentReply":"Let me check the sale details for you and issue a price adjustment if applicable.",
     "customerResponse":"Thank you for looking into that."
  },
  {
     "name":"Steve Taylor",
     "phoneNumber":"123-456-7892",
     "subject":"Order Status Inquiry",
     "tags":[
        "Order",
        "Status",
        "Shipping"
     ],
     "customerReasonForSupport":"I haven't received any updates on my order status.",
     "agentReply":"I will check your order and get back to you with an update soon.",
     "customerResponse":"Please update me soon."
  },
  {
     "name":"Tina Parker",
     "phoneNumber":"234-567-8903",
     "subject":"Website Navigation Issue",
     "tags":[
        "Website",
        "Navigation",
        "User Experience"
     ],
     "customerReasonForSupport":"I can’t seem to find the right product on your website.",
     "agentReply":"Let me guide you to the product you're looking for. Could you tell me more about it?",
     "customerResponse":"Yes, I’m looking for a pair of running shoes."
  },
  {
     "name":"Uma Patel",
     "phoneNumber":"345-678-9014",
     "subject":"Out of Stock Notification",
     "tags":[
        "Stock",
        "Out of Stock",
        "Product"
     ],
     "customerReasonForSupport":"I need to know if an item will be restocked soon.",
     "agentReply":"I’ll check with our stock team and notify you when it becomes available.",
     "customerResponse":"I appreciate that, thanks."
  },
  {
     "name":"Vera Thompson",
     "phoneNumber":"456-789-0125",
     "subject":"Fraud Alert",
     "tags":[
        "Security",
        "Fraud",
        "Suspicious"
     ],
     "customerReasonForSupport":"I noticed suspicious activity on my account and need to secure it.",
     "agentReply":"I will assist you in securing your account and investigating any potential fraud.",
     "customerResponse":"Thank you for your quick response."
  },
  {
     "name":"William Jackson",
     "phoneNumber":"567-890-1236",
     "subject":"Damaged Product",
     "tags":[
        "Shipping",
        "Damaged",
        "Refund"
     ],
     "customerReasonForSupport":"The product I received was damaged upon arrival.",
     "agentReply":"I’m very sorry. We will send a replacement or process a refund for the damaged item.",
     "customerResponse":"I prefer a replacement, thank you."
  }
]
