This is a web application to make it easy to open files and search for text content
inside large code projects. You can see an example running against my github
repositories at http://code.tiagobai.com


Getting started:

1   - Install node.js: http://nodejs.org/

2   - Install mongodb: http://www.mongodb.org/

3   - Install dependencies.
      npm install

4   - Check the configurations at config.js and start the server:
      "node app" or "npm run-script dev"

Using sendmail as email server:
# sudo apt-get install sendmail
# sudo sendmailconfig



To repair mongodb:
# sudo rm /var/lib/mongodb/mongod.lock
# sudo -u mongodb mongod -f /etc/mongodb.conf --repair

Check it live at http://code.tiagobai.com
