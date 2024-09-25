<span style="font-size: .8rem">Last updated: 2024-07-11</span>

### Why this tool? 🤔

In May 2022, Cloudflare launched R2 into open beta, a new S3-like object storing platform with generous free tier. It is a great alternative to AWS S3, especially for small projects and personal use. You can use the Cloudflare R2 dashboard to upload files directly, but it's kinda painful to use, this tool aims to solve these problems for the R2 users:

- **Upload big files**, R2 dashboard could only upload files which size is smaller than 300Mb, R2 Uploader can handle the upload for a single file up to 100Gb in theory (huge thanks to [@spurin](https://github.com/spurin)).
- **Image compression**, lots of users would just use R2 as a CDN, so we added this function to make the images load faster.
- **Easily jump between multiple buckets**, setup multiple workers for different buckets, and switch between them fast.
- **Sync configs across devices safely**, you can login with GitHub and sync your configs, all data is AES encrypted locally before sending to our database.

### Requirements ☝️

- Cloudflare account
- Cloudflare R2 Subscription (has a free quota)
- Cloudflare Workers Subscription (free plan would be enough)

![](https://r2-cf-api.jw1.dev/dashboard.png)

### Set up the R2 bucket 📦

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left panel, there is a section called "R2". Click on it.
3. Create a new bucket by clicking on the "Create Bucket" button. (You will need to input the bucket name)

And that's it, now we set up the workers.

### Set up the Worker 👷‍♂️

A Worker is like the backend of a website, it allows the R2 Uploader to communicate with the R2 bucket. **This is the most important part of the setup, so please follow the steps carefully.**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left panel, there is a section called "Workers & Pages". Click on it.
3. Click on the "Create Application" button and the click on the "Create Worker" button.
4. So now Cloudflare will automatically generate a name for your Worker, you can either enter a name you like or leave it as it is. Ignore that code preview section, and now click the "Deploy" button.
5. Click on the button "Edit code", now you will see a code editor, paste code from this js file: [worker.js](https://raw.githubusercontent.com/jw-12138/r2-uploader-example-worker/main/dist/worker.js).  
   This is also [open sourced](https://github.com/jw-12138/r2-uploader-example-worker), you can always [build the code yourself](https://github.com/jw-12138/r2-uploader-example-worker?tab=readme-ov-file#how-to-use).

6. Now click on the "Save and Deploy" button, you will see a URL on top of the page, copy it to somewhere like a notepad, **we will need it later**.

7. Go to the worker page, go to the "Settings" and then click the "Variable" on the left side.

   ![](https://r2-cf-api.jw1.dev/r2_page.png)

8. First we focus on the "Environment Variables" section, we need to add a key value pair for the Worker to read as a configuration. Click on the "Add variable" button, and then enter the variable name as "AUTH_KEY_SECRET" and the value is a random string, you can generate one [here](https://www.avast.com/random-password-generator), click "Save and deploy". Remember to save the value somewhere, **we will need it later**.

   ![](https://r2-cf-api.jw1.dev/workers_api_key_setup.png)

9. Now we scroll down to the "R2 Bucket Bindings" section, click on the "Add binding" button, and then enter the variable name as "R2_BUCKET" and the value is the name of the bucket you created earlier, click "Save and deploy".

   ![](https://r2-cf-api.jw1.dev/r2_bindings_to_worker.png)

If you go to the Worker URL now, you will see a "Hello R2!" message, that means the worker is working as expected.

Now we have set up the worker, we can now set up the uploader.

### Set up the Uploader 🗄️

Phew, we've come a long way, now we are going to set up the uploader, which is the web interface for the R2 bucket.

![](https://r2-cf-api.jw1.dev/eFeFgOgn_bXLbpYs.png)

Remember the Worker URL and the random string we saved earlier? We will need them now.

In R2 Uploader, we call the Worker URL as the "Endpoint" and the random string as the "API Key". Enter the Endpoint and the API key, ignore the custom domain for now and click "Save to LocalStorage".

Now you can upload and manage your files in the R2 bucket!

![upload files with the uploader](https://r2-cf-api.jw1.dev/p3eqM3JOpcDfzXdi.png)

<span style="font-size: 2rem">🎉</span>

R2 Uploader **does not** store your Endpoints or API keys in the cloud, it is stored in your browser's LocalStorage, which means it is only accessible by you. All the traffic goes through the Worker and the R2 bucket you just created.

**Note:** We use `showDirectoryPicker` API to make the folder upload possible, if the `Choose Folder` button doesn't show up, it simply means that your browser does not support this API. ([showDirectoryPicker on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker))

### For private use 🔒

By default, the Worker will allow all the GET requests to go through, which means anyone can access your file if they know the URL.

If you want to make your bucket private, you can do so by adding a new variable in the Worker settings.

1. Go to the worker page, go to the "Settings" and then click the "Variable" on the left side.
2. Click on the "Edit variable" and "Add variable" button, then enter the variable name as "PRIVATE_BUCKET" and the value is "true", click "Save and deploy".
   
This will make the Worker to check the `x-api-key` header for every request, and only allow the request with the correct API key to go through.

If you want the bucket to be public again, just delete the variable.

### Set up a custom domain 🌐

By default, the Worker URL should be working right away, unless you want the url to be a little bit clean or, you live in China (or maybe some other country). Unfortunately, the domain name `workers.dev` is blocked in China, so we need to set up a custom domain.

Workers and R2 both supports custom domain, and we just need one of them to make the R2 work in China.

**For Workers:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left panel, there is a section called "Workers & Pages". Click on it.
3. Go to your Worker, click on the "Triggers", you'll see a custom domain section, click on the "Add Custom Domain" button. Input the domain name and you're done!
4. Remember to replace the Endpoint in the R2 Uploader with the custom domain.

**For R2:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left panel, there is a section called "R2". Click on it.
3. Go to your bucket, click on the "Settings", find "Custom Domains" section, and then click on the "Connect Domain" button. Input the domain name just like you did in the Workers, and you're done!
4. Remember to update the **Custom Domain** in the R2 Uploader with **the R2 custom domain**.

   Attention! This time, instead of changing the Endpoint field in the R2 Uploader, we change the Custom Domain field with the R2 custom domain.

   ![](https://r2-cf-api.jw1.dev/endpoint.png)

This sounds a little bit complicated, let me break it down for you:

- Setting up a custom domain for Workers is the simplest way to work with R2 Uploader

### Running/Testing with Docker (and optionally, ngrok) 🐋

**Contributor:** [@spurin](https://github.com/spurin)

1. build an image from the source code directory

   ```shell
   docker build -t r2-uploader
   ```

2. Run the image as a container

   ```shell
   docker run --name r2-uploader -p 7896:7896 r2-uploader
   ```

3. Optional, use ngrok to route a reverse proxy domain, mitigates cross origin failures when running locally

   ```shell
   # Install ngrok, see ngrok.com
   ngrok config add-authtoken <your_token>
   ngrok http http://localhost:7896
   # Navigate to the url provided
   ```

4. Cleanup

   ```shell
   docker stop r2-uploader
   docker rm r2-uploader
   docker rmi r2-uploader
   ```

### Hidden features 😜

1. You can copy a file from your system and then paste it into the uploader, it will automatically queue the file and ready to be uploaded.
2. To edit the name of queued files, just click on the file name.
3. Rename the file like `folder/file.txt` will upload the `file.txt` to the folder, you'll get a folder structure in your bucket.

---

Ok now, I think we've covered everything, if you have any questions, feel free to create a new issue under [this repo](https://github.com/jw-12138/r2-uploader/issues).
