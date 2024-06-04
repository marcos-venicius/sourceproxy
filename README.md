# Firewall source port bypass

When you have a firewall that only allow you to connect to a web service port if the source port is a specific one,
is hard to do it by hand, for example using a netcat.

Imagine that the page have links, and this links should be loaded too to load the page correctly, this will be hard to handle.

**I have the solution**

I built this proxy with this purpose.

Basically, imagine that the firewall have a rule that only allows you to connect at port `8180` if the connection is comming from port `53`

You can just run:

> imagine that the victim ip is `10.0.0.2`

```bash
node main.js 0.0.0.0:53-10.0.0.2:8180
```

Now, just opens your browser at `http://localhost:4040` and see the magic happening.

