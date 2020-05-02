# /usr/src/nodejs/hello-docker/Dockerfile
FROM guanlanlu/node_and_git

# 在容器中创建一个目录
RUN mkdir -p /usr/src

# 定位到容器的工作目录
WORKDIR /usr/src

# 拉仓库并且安装
RUN git clone https://github.com/dianluyuanli-wp/psyBackEnd.git
WORKDIR /usr/src/psyBackEnd
RUN npm i

EXPOSE 3000
CMD npm run start
