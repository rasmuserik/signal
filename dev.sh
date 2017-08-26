(sleep 0.1; touch sample-implementation.js) &
while inotifywait -e modify,close_write,move_self -q *.js
do 
  kill -9 `cat .pid`
  sleep 0.1
  clear
  SIGNAL_URL=http://localhost:1234/ node sample-implementation.js &
  echo $! > .pid
  sleep 1
  curl http://localhost:1234/?recv=signal&since=0
  sleep 1
  curl 'http://localhost:1234/?send=0EGSTBWIWvbQZTCkJcbb_8gFIBUMTdJk9AtDZLEkIag&msg=helloWorld' &
done
