all: clean build
	@docker-compose up -d

build:
	@docker-compose build 

fbuild: 
	@docker-compose build --no-cache

up:
	@docker rmi $(shell docker images -f "dangling=true" -qa) && docker-compose up -d

down:
	@docker-compose down

logs:
	@docker-compose logs -f

clean: 
	@docker-compose down -v --rmi all
	@docker volume prune -f

fclean:	clean
	@rm -rf postgres/data/*
	@docker image rm postgres 
	@docker image rm tx_nest


prune:
	@docker system prune -af

space:
	@docker system df

re: fclean build

.PHONY:		all build up down logs clean fclean re space mariadb wordpress nginx
