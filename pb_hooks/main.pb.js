// fires for every collection

onRecordAfterCreateRequest((e) => {
  const userRecord = $app.dao().findRecordById('users', e.record.get('user'));
  // console.log('ID');
  // console.log(e.record.id);
  userRecord.set('orders', [...userRecord.get('orders'), e.record.id]);

  const cartRecord = $app.dao().findRecordById('carts', userRecord.get('cart'));

  cartRecord.set('orders', [...cartRecord.get('orders'), e.record.id]);

  $app.dao().saveRecord(cartRecord);
  console.log('order ADDED TO CART');

  $app.dao().saveRecord(userRecord);
}, 'orders');

onRecordAfterCreateRequest((e) => {
  const userRecord = $app.dao().findRecordById('users', e.record.get('user'));

  userRecord.set('customizerPresets', [...userRecord.get('customizerPresets'), e.record.id]);

  $app.dao().saveRecord(userRecord);
}, 'customizerPresets');

onRecordAfterCreateRequest((e) => {
  const userRecord = $app.dao().findRecordById('users', e.record.get('user'));
  // console.log('ID');
  // console.log(e.record.id);
  userRecord.set('deliveryList', [...userRecord.get('deliveryList'), e.record.id]);

  $app.dao().saveRecord(userRecord);
}, 'deliveryDetails');

onRecordAfterUpdateRequest((e) => {
  const userRecord = $app.dao().findRecordById('users', e.record.get('user'));

  const status = e.record.get('status');

  if (status === 'forapprove') {
    const email = userRecord.get('email');

    const openUrl = 'https://orthodgt.com/account/dashboard/#dashboard-' + e.record.get('id');
    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: [{ address: email }],
      subject: 'Your order is waiting for approval',
      html: '<a href="' + openUrl + '">Check and approve now!</a>',
    });

    $app.newMailClient().send(message);
  }
}, 'orders');

routerAdd('POST', '/api/requestBonusPayment1/:bonuses', (e) => {
  console.log('bef test');

  let bonuses = e.pathParam('bonuses');

  console.log('test', bonuses);
  // do something ...
  return e.json(200, { success: true });
});

routerAdd('POST', '/api/requestBonusPayment/:bonuses', (e) => {
  let bonuses = e.pathParam('bonuses');
  console.log('bonuses', bonuses);
  // do something ...
  return e.json(200, { success: true });
});

routerAdd('GET', '/api/requestBonusPayment3/:bonuses', (e) => {
  let bonuses = e.pathParam('bonuses');
  console.log('bonuses 3 get', bonuses);
  // do something ...
  return e.json(200, { success: true });
});

routerAdd('POST', '/api/requestBonusPayment3/:bonuses', (e) => {
  let bonuses = e.pathParam('bonuses');
  console.log('bonuses 3 post', bonuses);
  // do something ...
  return e.json(200, { success: true });
});

routerAdd('POST', '/api/createInvoice/:bonuses', (e) => {
  const userRecord = $apis.requestInfo(e).authRecord;

  let bonuses = e.pathParam('bonuses');
  const cash = userRecord.get('cash');
  if (cash < bonuses) {
    return e.json(500, { error: 'Not enough bonuses' });
  }

  const cartRecord = $app.dao().findRecordById('carts', userRecord.get('cart'));
  const recordIds = cartRecord.get('orders');
  const orderList = [];
  const restCartIds = [];

  for (let i = 0; i < recordIds.length; i++) {
    const orderRecord = $app.dao().findRecordById('orders', recordIds[i]);
    const isSelected = orderRecord.get('selectedInCart');
    if (isSelected) {
      // orderRecord.set('status', 'payment');
      // $app.dao().saveRecord(orderRecord);

      orderList.push({
        record: orderRecord,
        id: orderRecord.get('id'),
        itemType: orderRecord.get('itemType'),
        itemName: orderRecord.get('itemName'),
        customizer: orderRecord.get('customizer'),
        totalPrice: orderRecord.get('totalPrice'),
        discount: orderRecord.get('discount'),
      });
    }
    else {
      restCartIds.push(orderRecord.get('id'));
    }
  }

  cartRecord.set('orders', restCartIds);
  // $app.dao().saveRecord(cartRecord);

  let totalBonusAmount = bonuses;
  // const mediumBonus = Math.round(bonuses / orderList.length);
  const items = orderList.map((order) => {
    const possibleDiscount = order.totalPrice - order.discount;
    // console.log('1', possibleDiscount);
    let currentDiscount = 0;
    if (possibleDiscount < 0) {
      currentDiscount = 0;
    }
    else if (totalBonusAmount >= possibleDiscount) {
      currentDiscount = possibleDiscount;
      totalBonusAmount -= possibleDiscount;
    }
    else {
      currentDiscount = totalBonusAmount;
      totalBonusAmount = 0;
    }
    // console.log('currentDiscount,', currentDiscount);
    const discount = Number(order.discount) + Number(currentDiscount);
    // const description = order.customizer.stickers.length ? 'customizations: ' + customizer.stickers.map(sticker => sticker.type).join(', ') : '';
    return {
      description: '',
      // description,
      name: order.itemType + ' ' + order.itemName,
      quantity: '1',
      unit_amount: {
        currency_code: 'EUR',
        value: order.totalPrice.toFixed(2),
      },
      discount: {
        amount: {
          currency_code: 'EUR',
          value: discount.toFixed(2),
        },
      },
    };
  });

  // console.log('items.lo AFTER');

  // const authHeader = 'QWFwem9LdGhZNFE5RFZnTE9NSXFhRUk3MjdsTXVDYTlyS254NGJQUlU5UThMU05qYXdiZHFTME9YWG9rODZ0enRTZ09BZDBQTVZUNnA4blc6RUVBcHlveFdwR081YVpvZFVZOXVsMk1Ha1RSbDZ0VjBuT3JZN0FTZHJSWHlpbng2SjB1SVNuQ1BBODBubUc3T0QzSXdFdVc4cWNBdXdnQzI=';
  // const authHeader = 'QVpuWVJoR1habW5YbTBkbVBpTHJJUUpjV1NHLW1yaUNwRXVjMjd3NkZ2MEtRTFVidUFKVUpqLVpUXy1sRDg5bFl4N0x2RVVXOVlpODhJcEk6RUs5Z3BzRl82Tmd3Qmh5VnREeXk2aTJnM1hDdkV4d1pDRGdBTkpjVGtiYk5vZy1OLVkxTUVmVnpnMWd6eEdtRnFKYzNTb0s3NWE3YlY3T1c=';
  const authHeader = process.env.PAYPAL_CLIENT_KEY;

  // console.log('authHeader', authHeader);
  try {
    const tokenResponce = $http.send({
      url: 'https://api-m.paypal.com/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (tokenResponce.statusCode === 200) {
      const tokenData = tokenResponce.json;

      const response = $http.send({
        url: 'https://api-m.paypal.com/v2/invoicing/invoices',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          detail: {
            currency_code: 'EUR',
          },
          invoicer: {
            business_name: 'ORTHO DGT SIA',
            tax_id: 'PVN reģ. Nr LV40203578585',
            address: {
              address_line_1: 'jur. adrese Zemitāna iela 2B,',
              address_line_2: 'Rīga, LV-101',
            },
            phones: [
              {
                country_code: '371',
                national_number: '23279911',
                phone_type: 'MOBILE',
              },
            ],
            website: 'https://orthodgt.com/',
            logo_url: 'https://web-site-static.fra1.cdn.digitaloceanspaces.com/nuxt-app/logo.jpg',
          },
          primary_recipients: [
            {
              billing_info: {
                email_address: userRecord.get('email'),
              },
            },
          ],
          items,
        }),
      });

      const invoicesCollection = $app.dao().findCollectionByNameOrId('invoices');
      const invoiceRecord = new Record(invoicesCollection);
      const form = new RecordUpsertForm($app, invoiceRecord);
      form.loadData({
        user: userRecord.id,
        invoiceID: response.json.id,
        // id: response.json.id,
        orders: orderList.map(order => order.id),
        paid: false,
        details: {
          detail: response.json.detail,
          items: response.json.items,
          invoicer: response.json.invoicer,
        },
      });
      form.submit();

      $app.dao().saveRecord(invoiceRecord);

      const invoiceId = invoiceRecord.get('id');
      // console.log('invoiceId', invoiceId);
      userRecord.set('invoices', [...userRecord.get('invoices'), invoiceId]);
      // console.log('cash', userRecord.get('cash'), bonuses);
      if (bonuses) {
        userRecord.set('cash', userRecord.get('cash') - bonuses);
      }

      $app.dao().saveRecord(userRecord);

      const link = response.json.links.find(link => link.rel === 'send');
      // console.log('link', link.href);
      $app.dao().saveRecord(cartRecord);

      const sendResponse = $http.send({
        url: link.href,
        method: link.method,
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          send_to_invoicer: true,
          send_to_recipient: true,
          subject: 'invoice sub',
          note: 'some note',
        }),
      });

      orderList.forEach((order) => {
        order.record.set('invoiceLink', sendResponse.json.href);
        order.record.set('status', 'payment');
        $app.dao().saveRecord(order.record);
      });

      return e.json(200, { ...sendResponse.json, createdResponse: response.json });
    }
    else {
      console.error('Failed to fetch PayPal token:', tokenResponce);
      return e.json(500, { error: 'Failed to fetch PayPal token' });
    }
  }
  catch (error) {
    return e.json(500, { error: 'Error requesting PayPal:', resp: response.json });
  }

  // do something ...
  // return e.json(200, { success: true });
}, $apis.requireRecordAuth());

routerAdd('POST', '/api/createSingleInvoice/:bonuses/:id', (e) => {
  const userRecord = $apis.requestInfo(e).authRecord;

  let bonuses = e.pathParam('bonuses');
  let orderId = e.pathParam('id');

  let cashAmount = 0;
  const bonusList = userRecord.get('bonuses');
  for (let i = 0; i < bonusList.length; i++) {
    const bonusRecord = $app.dao().findRecordById('bonuses', bonusList[i]);
    cashAmount += bonusRecord.get('amount');
  }

  if (cashAmount < bonuses) {
    return e.json(500, { error: 'Not enough bonuses' });
  }

  const cartRecord = $app.dao().findRecordById('carts', userRecord.get('cart'));
  const recordIds = cartRecord.get('orders');
  const orderList = [];

  if (!recordIds.includes(orderId)) {
    return e.json(500, { error: `Invalid order ID:${orderId}` });
  }

  const restCartIds = recordIds.filter(id => id !== orderId);

  const orderRecord = $app.dao().findRecordById('orders', orderId);
  // console.log(1.4);
  orderList.push({
    record: orderRecord,
    id: orderRecord.get('id'),
    itemType: orderRecord.get('itemType'),
    itemName: orderRecord.get('itemName'),
    customizer: orderRecord.get('customizer'),
    totalPrice: orderRecord.get('totalPrice'),
    discount: orderRecord.get('discount'),
  });
  // console.log(1.7);

  cartRecord.set('orders', restCartIds);
  // $app.dao().saveRecord(cartRecord);
  // console.log(2);

  let totalBonusAmount = bonuses;
  // const mediumBonus = Math.round(bonuses / orderList.length);
  const items = orderList.map((order) => {
    const possibleDiscount = order.totalPrice - order.discount;
    // console.log('1', possibleDiscount);
    let currentDiscount = 0;
    if (possibleDiscount < 0) {
      currentDiscount = 0;
    }
    else if (totalBonusAmount >= possibleDiscount) {
      currentDiscount = possibleDiscount;
      totalBonusAmount -= possibleDiscount;
    }
    else {
      currentDiscount = totalBonusAmount;
      totalBonusAmount = 0;
    }
    // console.log('currentDiscount,', currentDiscount);
    const discount = Number(order.discount) + Number(currentDiscount);
    // const description = order.customizer.stickers.length ? 'customizations: ' + customizer.stickers.map(sticker => sticker.type).join(', ') : '';
    return {
      description: '',
      // description,
      name: order.itemType + ' ' + order.itemName,
      quantity: '1',
      unit_amount: {
        currency_code: 'EUR',
        value: order.totalPrice.toFixed(2),
      },
      discount: {
        amount: {
          currency_code: 'EUR',
          value: discount.toFixed(2),
        },
      },
    };
  });

  console.log('items.lo AFTER');

  // const authHeader = 'QWFwem9LdGhZNFE5RFZnTE9NSXFhRUk3MjdsTXVDYTlyS254NGJQUlU5UThMU05qYXdiZHFTME9YWG9rODZ0enRTZ09BZDBQTVZUNnA4blc6RUVBcHlveFdwR081YVpvZFVZOXVsMk1Ha1RSbDZ0VjBuT3JZN0FTZHJSWHlpbng2SjB1SVNuQ1BBODBubUc3T0QzSXdFdVc4cWNBdXdnQzI=';
  // const authHeader = 'QVpuWVJoR1habW5YbTBkbVBpTHJJUUpjV1NHLW1yaUNwRXVjMjd3NkZ2MEtRTFVidUFKVUpqLVpUXy1sRDg5bFl4N0x2RVVXOVlpODhJcEk6RUs5Z3BzRl82Tmd3Qmh5VnREeXk2aTJnM1hDdkV4d1pDRGdBTkpjVGtiYk5vZy1OLVkxTUVmVnpnMWd6eEdtRnFKYzNTb0s3NWE3YlY3T1c=';
  const authHeader = process.env.PAYPAL_CLIENT_KEY;
  // const authHeader = process.env.PAYPAL_DEV_CLIENT_KEY;

  // console.log('authHeader', authHeader);
  try {
    const tokenResponce = $http.send({
      url: 'https://api-m.paypal.com/v1/oauth2/token',
      // url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (tokenResponce.statusCode === 200) {
      const tokenData = tokenResponce.json;

      const billingDetails = userRecord.get('billingDetails');
      const deliveryDetails = userRecord.get('deliveryDetails');

      orderRecord.set('billingDetails', billingDetails);
      orderRecord.set('deliveryDetails', deliveryDetails);

      const parsedBillingDetails = JSON.parse(deliveryDetails || '{}');
      const country = parsedBillingDetails.country;
      const city = parsedBillingDetails.city;
      const address = parsedBillingDetails.address;
      const zipCode = parsedBillingDetails.zipCode;

      const addressLine1 = `${country}, ${city}`;
      const addressLine2 = `${address}, ${zipCode}`;

      const patientName = 'Patient name: ' + orderRecord.get('patient');
      const doctorName = userRecord.get('name');

      const response = $http.send({
        url: 'https://api-m.paypal.com/v2/invoicing/invoices',
        // url: 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          detail: {
            currency_code: 'EUR',
            note: patientName,
          },
          invoicer: {
            business_name: 'ORTHO DGT SIA',
            tax_id: 'PVN reģ. Nr LV40203578585',
            address: {
              address_line_1: 'jur. adrese Zemitāna iela 2B,',
              address_line_2: 'Rīga, LV-101',
            },
            phones: [
              {
                country_code: '371',
                national_number: '23279911',
                phone_type: 'MOBILE',
              },
            ],
            website: 'https://orthodgt.com/',
            logo_url: 'https://web-site-static.fra1.cdn.digitaloceanspaces.com/nuxt-app/logo.jpg',
          },
          primary_recipients: [
            {
              billing_info: {
                email_address: userRecord.get('email'),
                business_name: doctorName,
                address: {
                  address_line_1: addressLine1,
                  address_line_2: addressLine2,
                },
              },
            },
          ],
          items,
        }),
      });

      const invoicesCollection = $app.dao().findCollectionByNameOrId('invoices');
      const invoiceRecord = new Record(invoicesCollection);
      const form = new RecordUpsertForm($app, invoiceRecord);
      form.loadData({
        user: userRecord.id,
        invoiceID: response.json.id,
        orders: orderList.map(order => order.id),
        paid: false,
        details: {
          detail: response.json.detail,
          items: response.json.items,
          invoicer: response.json.invoicer,
        },
      });
      form.submit();

      $app.dao().saveRecord(invoiceRecord);

      const invoiceId = invoiceRecord.get('id');
      userRecord.set('invoices', [...userRecord.get('invoices'), invoiceId]);

      $app.dao().saveRecord(userRecord);

      const link = response.json.links.find(link => link.rel === 'send');
      // console.log('link', link.href);
      orderRecord.set('invoices', [...orderRecord.get('invoices'), invoiceId]);

      $app.dao().saveRecord(orderRecord);
      $app.dao().saveRecord(cartRecord);

      const sendResponse = $http.send({
        url: link.href,
        method: link.method,
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          send_to_invoicer: true,
          send_to_recipient: true,
          subject: 'invoice sub',
          note: 'some note',
        }),
      });

      orderList.forEach((order) => {
        order.record.set('invoiceLink', sendResponse.json.href);
        order.record.set('status', 'payment');
        $app.dao().saveRecord(order.record);
      });

      // After invoice creation and user cash update
      if (bonuses && bonuses > 0) {
        try {
          const bonusesCollection = $app.dao().findCollectionByNameOrId('bonuses');
          const bonusRecord = new Record(bonusesCollection);
          const form = new RecordUpsertForm($app, bonusRecord);
          form.loadData({
            user: userRecord.id,
            amount: -Math.abs(bonuses), // ensure negative
            type: 'orderPayment',
            invoice: invoiceRecord.get('id'),
          });
          form.submit();
          $app.dao().saveRecord(bonusRecord);

          // Add bonus to user's bonuses field
          const userBonuses = userRecord.get('bonuses') || [];
          userRecord.set('bonuses', [...userBonuses, bonusRecord.get('id')]);
          $app.dao().saveRecord(userRecord);
        }
        catch (err) {
          // Ignore if error
        }
      }

      return e.json(200, { ...sendResponse.json, createdResponse: response.json });
    }
    else {
      console.error('Failed to fetch PayPal token:', tokenResponce);
      return e.json(500, { error: 'Failed to fetch PayPal token' });
    }
  }
  catch (error) {
    return e.json(500, { error: 'Error requesting PayPal:', resp: response.json });
  }
}, $apis.requireRecordAuth());

routerAdd('POST', '/api/createAdditionalInvoice/:id', (e) => {
  const userRecord = $apis.requestInfo(e).authRecord;

  let orderId = e.pathParam('id');

  const orderRecord = $app.dao().findRecordById('orders', orderId);

  const items = [
    {
      description: '',
      name: 'Approved design',
      quantity: '1',
      unit_amount: {
        currency_code: 'EUR',
        value: orderRecord.get('approvePrice').toFixed(2),
      },
      discount: {
        amount: {
          currency_code: 'EUR',
          value: Number(0).toFixed(2),
        },
      },
    },
  ];
  // console.log('items.lo AFTER');

  // const authHeader = 'QWFwem9LdGhZNFE5RFZnTE9NSXFhRUk3MjdsTXVDYTlyS254NGJQUlU5UThMU05qYXdiZHFTME9YWG9rODZ0enRTZ09BZDBQTVZUNnA4blc6RUVBcHlveFdwR081YVpvZFVZOXVsMk1Ha1RSbDZ0VjBuT3JZN0FTZHJSWHlpbng2SjB1SVNuQ1BBODBubUc3T0QzSXdFdVc4cWNBdXdnQzI=';
  // const authHeader = 'QVpuWVJoR1habW5YbTBkbVBpTHJJUUpjV1NHLW1yaUNwRXVjMjd3NkZ2MEtRTFVidUFKVUpqLVpUXy1sRDg5bFl4N0x2RVVXOVlpODhJcEk6RUs5Z3BzRl82Tmd3Qmh5VnREeXk2aTJnM1hDdkV4d1pDRGdBTkpjVGtiYk5vZy1OLVkxTUVmVnpnMWd6eEdtRnFKYzNTb0s3NWE3YlY3T1c=';
  const authHeader = process.env.PAYPAL_CLIENT_KEY;
  // const authHeader = process.env.PAYPAL_DEV_CLIENT_KEY;

  // console.log('authHeader', authHeader);
  try {
    const tokenResponce = $http.send({
      url: 'https://api-m.paypal.com/v1/oauth2/token',
      // url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (tokenResponce.statusCode === 200) {
      const tokenData = tokenResponce.json;

      const deliveryDetails = userRecord.get('deliveryDetails');

      const parsedBillingDetails = JSON.parse(deliveryDetails || '{}');
      const country = parsedBillingDetails.country;
      const city = parsedBillingDetails.city;
      const address = parsedBillingDetails.address;
      const zipCode = parsedBillingDetails.zipCode;

      const addressLine1 = `${country}, ${city}`;
      const addressLine2 = `${address}, ${zipCode}`;

      const patientName = 'Patient name: ' + orderRecord.get('patient');
      const doctorName = userRecord.get('name');

      const response = $http.send({
        url: 'https://api-m.paypal.com/v2/invoicing/invoices',
        // url: 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          detail: {
            currency_code: 'EUR',
            note: patientName,
          },
          invoicer: {
            business_name: 'ORTHO DGT SIA',
            tax_id: 'PVN reģ. Nr LV40203578585',
            address: {
              address_line_1: 'jur. adrese Zemitāna iela 2B,',
              address_line_2: 'Rīga, LV-101',
            },
            phones: [
              {
                country_code: '371',
                national_number: '23279911',
                phone_type: 'MOBILE',
              },
            ],
            website: 'https://orthodgt.com/',
            logo_url: 'https://web-site-static.fra1.cdn.digitaloceanspaces.com/nuxt-app/logo.jpg',
          },
          primary_recipients: [
            {
              billing_info: {
                email_address: userRecord.get('email'),
                business_name: doctorName,
                address: {
                  address_line_1: addressLine1,
                  address_line_2: addressLine2,
                },
              },
            },
          ],
          items,
        }),
      });

      const invoicesCollection = $app.dao().findCollectionByNameOrId('invoices');
      const invoiceRecord = new Record(invoicesCollection);
      const form = new RecordUpsertForm($app, invoiceRecord);
      form.loadData({
        user: userRecord.id,
        invoiceID: response.json.id,
        orders: [orderId],
        paid: false,
        details: {
          detail: response.json.detail,
          items: response.json.items,
          invoicer: response.json.invoicer,
        },
      });
      form.submit();

      $app.dao().saveRecord(invoiceRecord);

      const invoiceId = invoiceRecord.get('id');
      userRecord.set('invoices', [...userRecord.get('invoices'), invoiceId]);

      $app.dao().saveRecord(userRecord);

      const link = response.json.links.find(link => link.rel === 'send');

      const sendResponse = $http.send({
        url: link.href,
        method: link.method,
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          send_to_invoicer: true,
          send_to_recipient: true,
          subject: 'invoice sub',
          note: 'some note',
        }),
      });

      orderRecord.set('invoiceLink', sendResponse.json.href);
      orderRecord.set('status', 'payment');
      orderRecord.set('invoices', [...orderRecord.get('invoices'), invoiceId]);

      $app.dao().saveRecord(orderRecord);

      return e.json(200, { ...sendResponse.json, createdResponse: response.json });
    }
    else {
      console.error('Failed to fetch PayPal token:', tokenResponce);
      return e.json(500, { error: 'Failed to fetch PayPal token' });
    }
  }
  catch (error) {
    return e.json(500, { error: 'Error requesting PayPal:', resp: response.json });
  }
}, $apis.requireRecordAuth());

routerAdd('POST', '/api/invoice/:id', (e) => {
  let id = e.pathParam('id');
  const body = $apis.requestInfo(e).data;

  if (body) {
    if (body.resource && body.resource.invoice) {
      const invoiceRecord = $app.dao().findFirstRecordByData('invoices', 'invoiceId', body.resource.invoice.id);

      const date = new DateTime();

      invoiceRecord.set('paid', true);
      invoiceRecord.set('paidDate', date);
      invoiceRecord.set('payments', body.resource.invoice.payments);

      $app.dao().saveRecord(invoiceRecord);

      const recordIds = invoiceRecord.get('orders');

      for (let i = 0; i < recordIds.length; i++) {
        const orderRecord = $app.dao().findRecordById('orders', recordIds[i]);
        orderRecord.set('status', 'inbox');
        $app.dao().saveRecord(orderRecord);
      }

      // --- BEGIN REFERRAL BONUS LOGIC ---
      const userId = invoiceRecord.get('user');
      const userRecord = $app.dao().findRecordById('users', userId);
      if (userRecord) {
        const refUserId = userRecord.get('referralUser');
        if (refUserId) {
          try {
            const refUser = $app.dao().findRecordById('users', refUserId);
            if (refUser && refUser.get('isReferral') === true) {
              // Calculate 10% of the paid amount from payments
              let totalAmount = body.resource.invoice.payments.paid_amount.value;

              const bonusAmount = Math.round(totalAmount * 0.1);

              if (bonusAmount > 0) {
                const bonusesCollection = $app.dao().findCollectionByNameOrId('bonuses');
                const bonusRecord = new Record(bonusesCollection);
                const form = new RecordUpsertForm($app, bonusRecord);
                form.loadData({
                  user: userId, // user who spent
                  amount: bonusAmount,
                  type: 'userPurchase',
                  invoice: invoiceRecord.get('id'),
                  name: userRecord.get('name'), // Add user's name here
                });
                form.submit();
                $app.dao().saveRecord(bonusRecord);

                // Add bonus to referrer's bonuses field
                const refUserBonuses = refUser.get('bonuses') || [];
                refUser.set('bonuses', [...refUserBonuses, bonusRecord.get('id')]);
                $app.dao().saveRecord(refUser);
              }
            }
          }
          catch (err) {
            // Ignore if referrer not found or other error
          }
        }
      }
      // --- END REFERRAL BONUS LOGIC ---
    }
  }

  return e.json(200, { success: true });
});

routerAdd('POST', '/api/invoicePaid/', (e) => {
  console.log('invoice PAID SuCCESS');

  const body = $apis.requestInfo(e).data;

  // console.log('id', body.id);
  // console.log('resource_type', body.resource_type);
  // console.log('event_type', body.event_type);
  // console.log('create_time', body.create_time);

  return e.json(200, { success: true });
});

// routerAdd('POST', '/api/status2/', (e) => {
//   console.log('test');
//   let status = e.request.pathValue('status');
//   console.log('status', status);
//
//   console.log('end status ');
//   return e.json(200, { message: 'Hello ' + 'www' });
// });
//
// routerAdd('GET', '/status/', (e) => {
//   console.log(e.request);
//
//   return e.json(200, { message: 'Hello!' });
// });

// routerUse((e) => {
//   console.log(e.request.url.path);
//   return e.next();
// });

// onRecordAfterDeleteSuccess((e) => {
//   // e.app
//   // e.record
//   const userRecord = $app.dao().findRecordById('users', e.record.get('user'));
//   const cartRecord = $app.dao().findRecordById('carts', userRecord.get('cart'));
//
//   console.log('order DELETED FROM CART');
//
//   e.next();
// }, 'orders');

onRecordAfterCreateRequest((e) => {
  const userRecord = $app.dao().findRecordById('users', e.record.get('user'));
  // console.log('ID');
  // console.log(e.record.id);

  // adding new payment to user record
  userRecord.set('payments', [...userRecord.get('payments'), e.record.id]);

  $app.dao().saveRecord(userRecord);

  const cartRecord = $app.dao().findRecordById('carts', userRecord.get('cart'));

  const recordIds = cartRecord.get('orders');
  cartRecord.set('orders', []);

  e.record.set('orders', recordIds);

  const billingDetails = userRecord.get('billingDetails');
  const deliveryDetails = userRecord.get('deliveryDetails');

  for (let i = 0; i < recordIds.length; i++) {
    const orderRecord = $app.dao().findRecordById('orders', recordIds[i]);
    orderRecord.set('status', 'inbox');
    orderRecord.set('billingDetails', billingDetails);
    orderRecord.set('deliveryDetails', deliveryDetails);
    $app.dao().saveRecord(orderRecord);
  }

  $app.dao().saveRecord(cartRecord);
  $app.dao().saveRecord(e.record);

  $app.dao().saveRecord(userRecord);
}, 'payments');

routerAdd('GET', '/api/referralAvalaible/:referralCode', (e) => {
  let referralCode = e.pathParam('referralCode');

  try {
    const userRecord = $app.dao().findRecordById('users', referralCode);
    if (userRecord && userRecord.get('isReferral') === true) {
      return e.json(200, { success: true });
    }
    return e.json(200, { success: false });
  }
  catch (err) {
    // User not found or other error
    return e.json(200, { success: false });
  }
});

// onRecordBeforeCreateRequest((e) => {
//   // const userRecord = $app.dao().findRecordById('users', e.record.get('user'));
//
//   console.log('ID');
//   console.log(e.record.id);
//   // userRecord.set('orders', [...userRecord.get('orders'), e.record.id]);
//
//   // const itemsCollection = $app.dao().findCollectionByNameOrId('items');
//   // const itemRecord = new Record(itemsCollection);
//   //
//   // const form = new RecordUpsertForm($app, itemRecord);
//
//   // $app.dao().saveRecord(userRecord);
// }, 'orders');

onRecordAfterCreateRequest((e) => {
  // console.log('ID');
  // console.log(e.record.id);
  const userRecord = $app.dao().findRecordById('users', e.record.get('user'));

  userRecord.set('cart', e.record.id);

  $app.dao().saveRecord(userRecord);
}, 'carts');

onRecordAfterCreateRequest((e) => {
  const userRecord = $app.dao().findRecordById('users', e.record.id);

  const cartsCollection = $app.dao().findCollectionByNameOrId('carts');
  const cartRecord = new Record(cartsCollection);
  const form = new RecordUpsertForm($app, cartRecord);
  form.loadData({
    user: e.record.id,
  });
  form.submit();

  $app.dao().saveRecord(cartRecord);

  const cartId = cartRecord.get('id');

  // console.log('cartId', cartId);
  userRecord.set('cart', cartId);

  const referralCode = e.record.get('referralUser');
  if (referralCode) {
    try {
      const refUser = $app.dao().findRecordById('users', referralCode);
      if (refUser && refUser.get('isReferral') === true) {
        // Create a bonus record for the new user
        const bonusesCollection = $app.dao().findCollectionByNameOrId('bonuses');
        const bonusRecord = new Record(bonusesCollection);
        const form = new RecordUpsertForm($app, bonusRecord);
        form.loadData({
          // user: e.record.id,
          amount: 100,
          type: 'gift',
        });
        form.submit();
        $app.dao().saveRecord(bonusRecord);

        const referralCollection = $app.dao().findCollectionByNameOrId('referral');
        const referralRecord = new Record(referralCollection);
        const referralForm = new RecordUpsertForm($app, referralRecord);
        referralForm.loadData({
          user: e.record.id,
        });
        referralForm.submit();
        const userBonuses = userRecord.get('bonuses') || [];
        userRecord.set('bonuses', [...userBonuses, bonusRecord.get('id')]);

        userRecord.set('showReferralNotification', true);
        const userReferralList = refUser.get('referralList') || [];
        refUser.set('referralList', [...userReferralList, referralRecord.get('id')]);
        $app.dao().saveRecord(refUser);
      }
    }
    catch (err) {
      // Ignore if referral user not found or other error
    }
  }

  $app.dao().saveRecord(userRecord);
}, 'users');

onRecordAfterAuthWithOAuth2Request((e) => {
  if (!e.isNewRecord) return;

  const userRecord = $app.dao().findRecordById('users', e.record.id);

  e.record.set('name', e.oAuth2User.name);

  const recordForm = new RecordUpsertForm($app, userRecord);

  const cartsCollection = $app.dao().findCollectionByNameOrId('carts');
  const cartRecord = new Record(cartsCollection);
  const form = new RecordUpsertForm($app, cartRecord);
  form.loadData({
    user: e.record.id,
  });
  form.submit();

  $app.dao().saveRecord(cartRecord);

  const cartId = cartRecord.get('id');

  recordForm.loadData({
    name: e.oAuth2User.name,
    cart: cartId,
  });

  console.log('cartId', cartId);
  // console.log('cart ID', cartRecord.get('id'));

  userRecord.set('cart', cartId);

  $app.dao().saveRecord(userRecord);

  try {
    if (e.oAuth2User.avatarUrl) {
      const res = $http.send({
        url: e.oAuth2User.avatarUrl,
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
        timeout: 10, // in seconds
      });

      const file = $filesystem.fileFromBytes(res.raw, 'avatar.png');

      recordForm.addFiles('avatar', file);

      const responseRecordForm = new RecordUpsertForm($app, e.record);
      responseRecordForm.addFiles('avatar', file);

      responseRecordForm.submit();
    }
  }
  catch (error) {
    console.log(`error: ${error} url: ${e.oAuth2User.avatarUrl}`);
  }

  recordForm.submit();

  // Referral bonus logic
  const referralCode = e.record.get('referralUser');
  if (referralCode) {
    try {
      const refUser = $app.dao().findRecordById('users', referralCode);
      if (refUser && refUser.get('isReferral') === true) {
        // Create a bonus record for the new user
        const bonusesCollection = $app.dao().findCollectionByNameOrId('bonuses');
        const bonusRecord = new Record(bonusesCollection);
        const form = new RecordUpsertForm($app, bonusRecord);
        form.loadData({
          // user: e.record.id,
          amount: 100,
          type: 'gift',
        });
        form.submit();
        $app.dao().saveRecord(bonusRecord);

        // Add the bonus record's ID to the user's bonuses field
        const userRecord = $app.dao().findRecordById('users', e.record.id);
        const userBonuses = userRecord.get('bonuses') || [];
        userRecord.set('bonuses', [...userBonuses, bonusRecord.get('id')]);
        $app.dao().saveRecord(userRecord);
      }
    }
    catch (err) {
      // Ignore if referral user not found or other error
    }
  }
});

// function corsMiddleware(next) {
//   const allowedOrigins = [
//     'http://192.168.50.140:3000',
//     'https://orthodgt.com',
//     'https://stage.orthodgt.com',
//     'https://orthodgt.pockethost.io',
//     '',
//   ];
//
//   return (c) => {
//     const origin = c.request().header.get('Origin');
//
//     if (allowedOrigins.indexOf(origin) === -1) {
//       console.log(
//         `The CORS policy for this site does not allow access from the specified Origin. ${origin} is not allowed`,
//       );
//       // throw or return an error
//       throw new BadRequestError(
//         `The CORS policy for this site does not allow access from the specified Origin. ${origin} is not allowed`,
//       );
//     }
//
//     return next(c); // proceed with the request chain
//   };
// }
//
// routerUse(corsMiddleware);
